use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{Utc, Datelike, NaiveDate, NaiveTime};
use crate::entities::{*};
use crate::utils::error::AppError;


#[derive(Serialize)]
pub struct InventoryStatusDto {
    pub total_items: i64,
    pub total_value: f64,
    pub low_stock_count: i64,
    pub by_category: Vec<CategoryStatDto>,
}

#[derive(Serialize)]
pub struct CategoryStatDto {
    pub category: String,
    pub count: i64,
    pub value: f64,
}

#[derive(Deserialize)]
pub struct InventoryFilter {
    pub category: Option<String>,
}

pub async fn get_inventory_status(
    State(db): State<DatabaseConnection>,
    Query(params): Query<InventoryFilter>,
) -> Result<impl IntoResponse, AppError> {
    let mut query = activos_repuestos::Entity::find();

    if let Some(cat) = params.category {
        if !cat.is_empty() {
            query = query.filter(activos_repuestos::Column::TipoRepuesto.eq(cat));
        }
    }

    let all_parts = query.all(&db).await?;
    
    let mut total_items = 0;
    let mut total_value = 0.0;
    let mut low_stock_count = 0;
    let mut category_map: HashMap<String, (i64, f64)> = HashMap::new();

    for part in all_parts {
        let quantity = part.stock_actual.unwrap_or(0);
        let cost = part.costo_unitario.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
        let value = (quantity as f64) * cost;
        
        total_items += quantity as i64;
        total_value += value;
        
        if quantity <= part.stock_minimo.unwrap_or(0) {
            low_stock_count += 1;
        }

        let cat_name = part.tipo_repuesto.clone().unwrap_or("Sin Categoría".to_string());
        let entry = category_map.entry(cat_name).or_insert((0, 0.0));
        entry.0 += quantity as i64;
        entry.1 += value;
    }

    let by_category = category_map.into_iter().map(|(k, v)| CategoryStatDto {
        category: k,
        count: v.0,
        value: v.1,
    }).collect();

    Ok(Json(InventoryStatusDto {
        total_items,
        total_value,
        low_stock_count,
        by_category,
    }))
}

#[derive(Serialize)]
pub struct MaintenanceRoiDto {
    pub asset_name: String,
    pub purchase_value: f64,
    pub maintenance_cost: f64,
    pub cost_ratio_percentage: f64,
}

pub async fn get_maintenance_roi(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let assets = activos_equipos::Entity::find().all(&db).await?;

    let mut results = Vec::new();

    for asset in assets {
        // Use equipo_id based on typical SeaORM convention if id_activo failed
        let maintenance_cost = mantenimiento_historial::Entity::find()
            .filter(mantenimiento_historial::Column::EquipoId.eq(asset.id_equipo))
            .all(&db)
            .await?
            .iter()
            .map(|h| h.costo_total.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0))
            .sum::<f64>();

        let purchase_value = asset.valor_compra.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
        
        let ratio = if purchase_value > 0.0 {
            (maintenance_cost / purchase_value) * 100.0
        } else {
            0.0
        };

        if maintenance_cost > 0.0 {
             results.push(MaintenanceRoiDto {
                asset_name: asset.nombre_equipo,
                purchase_value,
                maintenance_cost,
                cost_ratio_percentage: ratio,
            });
        }
    }

    results.sort_by(|a, b| b.cost_ratio_percentage.partial_cmp(&a.cost_ratio_percentage).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(Json(results.into_iter().take(20).collect::<Vec<_>>()))
}

#[derive(Serialize)]
pub struct AssetDepreciationDto {
    pub total_purchase_value: f64,
    pub total_current_value: f64,
    pub total_depreciation: f64,
    pub assets_analyzed: i64,
}

pub async fn get_asset_depreciation(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let assets = activos_equipos::Entity::find().all(&db).await?;

    let mut total_purchase = 0.0;
    let mut total_current = 0.0;
    let count = assets.len() as i64;
    let now = Utc::now().naive_utc().date();

    for asset in assets {
        let purchase_val = asset.valor_compra.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
        let life_months = asset.vida_util_meses.unwrap_or(60) as f64; // Default 5 years (60 months)
        let purchase_date = asset.fecha_adquisicion;

        let current_val = if let Some(p_date) = purchase_date {
            let age_days = (now - p_date).num_days() as f64;
            let age_months = age_days / 30.44; 

            // Depreciacion Lineal
            let dep_amount = if life_months > 0.0 {
                (purchase_val / life_months) * age_months
            } else {
                0.0
            };

            let mut val = purchase_val - dep_amount;
            if val < 0.0 { val = 0.0; }
            val
        } else {
            purchase_val
        };

        total_purchase += purchase_val;
        total_current += current_val;
    }

    Ok(Json(AssetDepreciationDto {
        total_purchase_value: total_purchase,
        total_current_value: total_current,
        total_depreciation: total_purchase - total_current,
        assets_analyzed: count,
    }))
}

// Scheduled Reports CRUD

pub async fn get_scheduled_reports(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let reports = reportes_programados::Entity::find()
        .order_by_desc(reportes_programados::Column::CreatedAt)
        .all(&db)
        .await?;
    Ok(Json(reports))
}

#[derive(Deserialize)]
pub struct CreateScheduledReportDto {
    pub nombre: String,
    pub tipo_reporte: String,
    pub frecuencia: String,
    pub filtros: Option<serde_json::Value>,
    pub destinatarios: Option<String>,
    pub fecha_inicio: NaiveDate,
    pub fecha_fin: Option<NaiveDate>,
    pub hora_ejecucion: NaiveTime,
}

pub async fn create_scheduled_report(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateScheduledReportDto>,
) -> Result<impl IntoResponse, AppError> {
    let new_report = reportes_programados::ActiveModel {
        nombre: Set(payload.nombre),
        tipo_reporte: Set(payload.tipo_reporte),
        frecuencia: Set(payload.frecuencia),
        filtros: Set(payload.filtros),
        destinatarios: Set(payload.destinatarios),
        fecha_inicio: Set(payload.fecha_inicio),
        fecha_fin: Set(payload.fecha_fin),
        hora_ejecucion: Set(payload.hora_ejecucion),
        activo: Set(Some(true)),
        ..Default::default()
    };

    let saved = new_report.insert(&db).await?;
    Ok(Json(saved))
}

pub async fn update_scheduled_report(
    Path(id): Path<i32>,
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateScheduledReportDto>,
) -> Result<impl IntoResponse, AppError> {
    let report: Option<reportes_programados::Model> = reportes_programados::Entity::find_by_id(id)
        .one(&db)
        .await?;

    let report = report.ok_or_else(|| AppError::NotFound("Report not found".to_string()))?;
    let mut report: reportes_programados::ActiveModel = report.into();

    report.nombre = Set(payload.nombre);
    report.tipo_reporte = Set(payload.tipo_reporte);
    report.frecuencia = Set(payload.frecuencia);
    report.filtros = Set(payload.filtros);
    report.destinatarios = Set(payload.destinatarios);
    report.fecha_inicio = Set(payload.fecha_inicio);
    report.fecha_fin = Set(payload.fecha_fin);
    report.hora_ejecucion = Set(payload.hora_ejecucion);
    report.updated_at = Set(Some(Utc::now().into()));

    let updated = report.update(&db).await?;
    Ok(Json(updated))
}

pub async fn delete_scheduled_report(
    Path(id): Path<i32>,
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    reportes_programados::Entity::delete_by_id(id)
        .exec(&db)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
pub struct GenerateReportRequest {
    pub report_type: String,
    // filters can be expanded later
    pub filters: Option<serde_json::Value>, 
}

pub async fn generate_report(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<GenerateReportRequest>,
) -> Result<impl IntoResponse, AppError> {
    let results = generate_report_data(&db, payload.report_type.as_str(), payload.filters).await?;
    Ok(Json(results))
}

// Helper function to generate report data
async fn generate_report_data(
    db: &DatabaseConnection,
    report_type: &str,
    filters: Option<serde_json::Value>,
) -> Result<Vec<serde_json::Value>, AppError> {
    let mut results = Vec::new();
    
    let empty_vec = Vec::new();
    let conditions = filters.as_ref()
        .and_then(|f| f.get("conditions"))
        .and_then(|c| c.as_array())
        .unwrap_or(&empty_vec);

    match report_type {
        "Inventario" => {
            let mut query = activos_repuestos::Entity::find();
            
            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                tracing::info!("Applying filter: {} {} {}", field, operator, value);

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "ID" => activos_repuestos::Column::IdRepuesto,
                    "Nombre" => activos_repuestos::Column::NombreRepuesto,
                    "SKU" => activos_repuestos::Column::CodigoRepuesto,
                    "Categoría" => activos_repuestos::Column::TipoRepuesto,
                    "Estado" => activos_repuestos::Column::Estado,
                    "Stock Actual" => activos_repuestos::Column::StockActual,
                    "Stock Mínimo" => activos_repuestos::Column::StockMinimo,
                    "Ubicación" => activos_repuestos::Column::UbicacionAlmacen,
                    "Fecha Última Compra" => activos_repuestos::Column::FechaUltimaCompra,
                    "Fecha Vencimiento" => activos_repuestos::Column::FechaVencimiento,
                    _ => {
                        tracing::warn!("Field not found for mapping: {}", field);
                        continue;
                    },
                };

                query = apply_filter(query, column, operator, value);
            }

            let parts = query.all(db).await?;
            
            for part in parts {
                results.push(serde_json::json!({
                    "ID": part.id_repuesto,
                    "Nombre": part.nombre_repuesto,
                    "SKU": part.codigo_repuesto,
                    "Categoría": part.tipo_repuesto.unwrap_or_default(),
                    "Estado": part.estado.unwrap_or_default(),
                    "Stock Actual": part.stock_actual.unwrap_or(0),
                    "Stock Mínimo": part.stock_minimo.unwrap_or(0),
                    "Costo Unitario": part.costo_unitario.unwrap_or_default().to_string(),
                    "Ubicación": part.ubicacion_almacen.unwrap_or_default(),
                    "Fecha Última Compra": part.fecha_ultima_compra,
                    "Fecha Vencimiento": part.fecha_vencimiento,
                }));
            }
        },
        "Activos" => {
            let mut query = activos_equipos::Entity::find();
            let mut has_estado_filter = false;
            
            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");
                
                if field == "Estado" {
                    has_estado_filter = true;
                }

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "Código" => activos_equipos::Column::CodigoEquipo,
                    "Nombre" => activos_equipos::Column::NombreEquipo,
                    "Marca" => activos_equipos::Column::Marca,
                    "Modelo" => activos_equipos::Column::Modelo,
                    "Serie" => activos_equipos::Column::NumeroSerie,
                    "Categoría" => activos_equipos::Column::Categoria,
                    "Ubicación" => activos_equipos::Column::Ubicacion,
                    "Estado" => activos_equipos::Column::Estado,
                    "Fecha Compra" => activos_equipos::Column::FechaAdquisicion,
                    _ => continue,
                };

                query = apply_filter(query, column, operator, value);
            }

            if !has_estado_filter {
                query = query.filter(activos_equipos::Column::Estado.ne("baja"));
            }

            let assets = query.all(db).await?;
            
            for asset in assets {
                results.push(serde_json::json!({
                    "Código": asset.codigo_equipo,
                    "Nombre": asset.nombre_equipo,
                    "Marca": asset.marca,
                    "Modelo": asset.modelo.unwrap_or_default(),
                    "Serie": asset.numero_serie.unwrap_or_default(),
                    "Categoría": asset.categoria.unwrap_or_default(),
                    "Ubicación": asset.ubicacion.unwrap_or_default(),
                    "Estado": asset.estado.unwrap_or_default(),
                    "Fecha Compra": asset.fecha_adquisicion,
                }));
            }
        },
        "Mantenimiento" => {
             let mut query = mantenimiento_historial::Entity::find()
                .order_by_desc(mantenimiento_historial::Column::FechaEjecucion);

            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "ID" => mantenimiento_historial::Column::IdMantenimiento,
                    "Técnico" => mantenimiento_historial::Column::TecnicoResponsable,
                    "Resultado" => mantenimiento_historial::Column::Resultado,
                    "Costo Total" => mantenimiento_historial::Column::CostoTotal,
                    "Fecha Ejecución" => mantenimiento_historial::Column::FechaEjecucion,
                    "Fecha Inicio" => mantenimiento_historial::Column::FechaInicio,
                    "Fecha Fin" => mantenimiento_historial::Column::FechaFin,
                    _ => continue,
                };

                query = apply_filter(query, column, operator, value);
            }

             let history = query.all(db).await?;

             for record in history {
                results.push(serde_json::json!({
                    "ID": record.id_mantenimiento,
                    "Fecha Ejecución": record.fecha_ejecucion,
                    "Fecha Inicio": record.fecha_inicio,
                    "Fecha Fin": record.fecha_fin,
                    "Técnico": record.tecnico_responsable.unwrap_or_default(), 
                    "Descripción": record.descripcion_trabajo.unwrap_or_default(),
                    "Resultado": record.resultado.unwrap_or_default(),
                    "Costo Total": record.costo_total.unwrap_or_default().to_string(),
                    "Observaciones": record.observaciones.unwrap_or("".to_string()),
                    "Fecha Creación": record.created_at.map(|d| d.to_string()),
                }));
             }
        },
        "PlanMantenimiento" => {
            let mut query = mantenimiento_calendario::Entity::find();

            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "ID" => mantenimiento_calendario::Column::IdMantenimientoCalendario,
                    "Estado" => mantenimiento_calendario::Column::Estado,
                    "Prioridad" => mantenimiento_calendario::Column::Prioridad,
                    "Fecha Programada" => mantenimiento_calendario::Column::FechaProgramada,
                    "Frecuencia" => mantenimiento_calendario::Column::Frecuencia,
                    _ => continue,
                };

                query = apply_filter(query, column, operator, value);
            }

            let calendar_items = query
                .find_also_related(activos_equipos::Entity)
                .order_by_asc(mantenimiento_calendario::Column::FechaProgramada)
                .all(db).await?;

            for (item, asset) in calendar_items {
                let asset_name = asset.map(|a| a.nombre_equipo).unwrap_or("Activo Desconocido".to_string());
                
                results.push(serde_json::json!({
                    "ID": item.id_mantenimiento_calendario,
                    "Activo": asset_name,
                    "Fecha Programada": item.fecha_programada,
                    "Próxima Fecha": item.proxima_fecha,
                    "Frecuencia": item.frecuencia.unwrap_or_default(),
                    "Estado": item.estado.unwrap_or_default(),
                    "Prioridad": item.prioridad.unwrap_or_default(),
                    "Costo Estimado": item.costo_estimado.unwrap_or_default().to_string(),
                    "Observaciones": item.observaciones.unwrap_or_default(),
                }));
            }
        },
        "Depreciación" => {
            let mut query = activos_equipos::Entity::find();
            
            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "ID" => activos_equipos::Column::IdEquipo,
                    "Activo" => activos_equipos::Column::NombreEquipo,
                    "Modelo" => activos_equipos::Column::Modelo,
                    "Serie" => activos_equipos::Column::NumeroSerie,
                    "Fecha Compra" => activos_equipos::Column::FechaAdquisicion,
                    "Estado" => activos_equipos::Column::Estado,
                    _ => continue,
                };

                query = apply_filter(query, column, operator, value);
            }

            let assets = query.all(db).await?;
            let now = Utc::now().naive_utc().date();

            for asset in assets {
                let purchase_val = asset.valor_compra.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
                let life_months = asset.vida_util_meses.unwrap_or(60) as f64;
                let purchase_date = asset.fecha_adquisicion;

                let (current_val, dep_accumulated) = if let Some(p_date) = purchase_date {
                    let age_days = (now - p_date).num_days() as f64;
                    let age_months = age_days / 30.44; 
                    let dep_amount = if life_months > 0.0 {
                        (purchase_val / life_months) * age_months
                    } else { 0.0 };

                    let mut val = purchase_val - dep_amount;
                    if val < 0.0 { val = 0.0; }
                    (val, purchase_val - val)
                } else {
                    (purchase_val, 0.0)
                };

                results.push(serde_json::json!({
                    "Activo": asset.nombre_equipo,
                    "Modelo": asset.modelo.unwrap_or_default(),
                    "Serie": asset.numero_serie.unwrap_or_default(),
                    "Fecha Compra": purchase_date,
                    "Fin Vida Útil": asset.fecha_fin_vida_util,
                    "Valor Compra": purchase_val,
                    "Valor Actual": (current_val * 100.0).round() / 100.0,
                    "Depreciación Acumulada": (dep_accumulated * 100.0).round() / 100.0,
                }));
            }
        },
        "OrdenesCompra" => {
            use crate::entities::orden_compra_repuesto;
            let mut query = orden_compra_repuesto::Entity::find();
            
            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "Código" => orden_compra_repuesto::Column::CodigoCompra,
                    "Estado" => orden_compra_repuesto::Column::Estado,
                    "Fecha Solicitud" => orden_compra_repuesto::Column::FechaSolicitud,
                    "Fecha Entrega" => orden_compra_repuesto::Column::FechaEntrega,
                    "Recepción" => orden_compra_repuesto::Column::EstadoRecepcion,
                    _ => continue,
                };

                query = apply_filter(query, column, operator, value);
            }

            let orders = query.all(db).await?;
            for order in orders {
                results.push(serde_json::json!({
                    "Código": order.codigo_compra.unwrap_or_default(),
                    "Estado": order.estado.unwrap_or_default(),
                    "Fecha Solicitud": order.fecha_solicitud,
                    "Fecha Entrega": order.fecha_entrega,
                    "Recepción": order.estado_recepcion.unwrap_or_default(),
                    "Total": order.total.unwrap_or_default().to_string(),
                    "Notas": order.notas.unwrap_or_default(),
                    "Creado": order.created_at.map(|d| d.to_string()),
                }));
            }
        },
        "OrdenesTrabajo" => {
            use crate::entities::orden_trabajo;
            let mut query = orden_trabajo::Entity::find();

            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "Código" => orden_trabajo::Column::CodigoOt,
                    "Prioridad" => orden_trabajo::Column::Prioridad,
                    "Estado" => orden_trabajo::Column::Estado,
                    "Fecha Inicio Real" => orden_trabajo::Column::FechaInicioReal,
                    _ => continue,
                };

                query = apply_filter(query, column, operator, value);
            }

            let wos = query.all(db).await?;
            for wo in wos {
                results.push(serde_json::json!({
                    "Código": wo.codigo_ot.unwrap_or_default(),
                    "Prioridad": wo.prioridad.unwrap_or_default(),
                    "Estado": wo.estado.unwrap_or_default(),
                    "Costo Estimado": wo.costo_estimado.unwrap_or_default().to_string(),
                    "Activo ID": wo.id_activo,
                    "Fecha Inicio Real": wo.fecha_inicio_real,
                    "Creado": wo.created_at.map(|d| d.to_string()),
                    "Observaciones": wo.observaciones.unwrap_or_default(),
                }));
            }
        },
        "ProveedoresTecnicos" => {
            use crate::entities::{proveedores, tecnicos};
            
            // Mixed filtering is complex, let's just apply it to providers for now or shared fields
            let mut prov_query = proveedores::Entity::find();
            let mut tech_query = tecnicos::Entity::find();

            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                match field {
                    "Nombre" => {
                        prov_query = apply_filter(prov_query, proveedores::Column::NombreProveedor, operator, value);
                        tech_query = apply_filter(tech_query, tecnicos::Column::Nombre, operator, value);
                    },
                    "Email" => {
                        prov_query = apply_filter(prov_query, proveedores::Column::Email, operator, value);
                        tech_query = apply_filter(tech_query, tecnicos::Column::Email, operator, value);
                    },
                    "Teléfono" => {
                        prov_query = apply_filter(prov_query, proveedores::Column::Telefono, operator, value);
                        tech_query = apply_filter(tech_query, tecnicos::Column::Telefono, operator, value);
                    },
                    "Estado" => {
                        prov_query = apply_filter(prov_query, proveedores::Column::Estado, operator, value);
                        tech_query = apply_filter(tech_query, tecnicos::Column::Estado, operator, value);
                    },
                    _ => {},
                }
            }

            let providers = prov_query.all(db).await?;
            for p in providers {
                results.push(serde_json::json!({
                    "Tipo": "Proveedor",
                    "Nombre": p.nombre_proveedor,
                    "Identificador": p.rut_o_ruc.unwrap_or_default(),
                    "Email": p.email.unwrap_or_default(),
                    "Teléfono": p.telefono.unwrap_or_default(),
                    "Estado": p.estado.unwrap_or_default(),
                    "Creado": p.created_at.map(|d| d.to_string()),
                }));
            }

            let techs = tech_query.all(db).await?;
            for t in techs {
                 results.push(serde_json::json!({
                    "Tipo": "Técnico",
                    "Nombre": format!("{} {}", t.nombre, t.apellido),
                    "Identificador": t.especialidad.unwrap_or_default(), 
                    "Email": t.email.unwrap_or_default(),
                    "Teléfono": t.telefono.unwrap_or_default(),
                    "Estado": t.estado,
                    "Creado": t.created_at.map(|d| d.to_string()),
                }));
            }
        },
        "SugeridoCompra" | "Sugerido de Compra" => {
            use sea_orm::sea_query::Expr;
            let mut query = activos_repuestos::Entity::find()
                .filter(Expr::col(activos_repuestos::Column::StockActual).lte(Expr::col(activos_repuestos::Column::StockMinimo)));
            
            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "Nombre" => activos_repuestos::Column::NombreRepuesto,
                    "Categoría" => activos_repuestos::Column::TipoRepuesto,
                    _ => continue,
                };
                query = apply_filter(query, column, operator, value);
            }

            let parts = query.all(db).await?;
            for part in parts {
                let stock = part.stock_actual.unwrap_or(0);
                let min = part.stock_minimo.unwrap_or(0);
                let sug = if min > stock { min - stock } else { 1 };

                results.push(serde_json::json!({
                    "SKU": part.codigo_repuesto,
                    "Nombre": part.nombre_repuesto,
                    "Categoría": part.tipo_repuesto.unwrap_or_default(),
                    "Stock Actual": stock,
                    "Stock Mínimo": min,
                    "Sugerido a Comprar": sug,
                    "Costo Promedio": part.costo_unitario.unwrap_or_default().to_string(),
                }));
            }
        },
        "SolicitudesCotizacion" => {
            use crate::entities::compras_solicitudes;
            let mut query = compras_solicitudes::Entity::find();

            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "ID" => compras_solicitudes::Column::Id,
                    "Título" => compras_solicitudes::Column::Motivo,
                    "Fecha Solicitud" => compras_solicitudes::Column::FechaSolicitud,
                    "Estado" => compras_solicitudes::Column::Estado,
                    "Prioridad" => compras_solicitudes::Column::Prioridad,
                    _ => continue,
                };
                query = apply_filter(query, column, operator, value);
            }

            let requests = query.all(db).await?;
            for req in requests {
                results.push(serde_json::json!({
                    "ID": req.id,
                    "Título": req.motivo,
                    "Fecha Solicitud": req.fecha_solicitud,
                    "Estado": req.estado,
                    "Prioridad": req.prioridad,
                    "Solicitante": req.solicitante_id, // Placeholder until user relation is confirmed
                    "Fecha Creación": req.created_at.map(|d| d.to_string()),
                }));
            }
        },
        "FacturasCompra" => {
            use crate::entities::{facturas_compras, proveedores};
            let mut query = facturas_compras::Entity::find();

            for cond in conditions {
                let field = cond.get("field").and_then(|v| v.as_str()).unwrap_or("");
                let operator = cond.get("operator").and_then(|v| v.as_str()).unwrap_or("eq");
                let value = cond.get("value").and_then(|v| v.as_str()).unwrap_or("");

                if field.is_empty() || value.is_empty() { continue; }

                let column = match field {
                    "N° Factura" => facturas_compras::Column::NumeroFactura,
                    "Fecha Emisión" => facturas_compras::Column::FechaEmision,
                    "Fecha Vencimiento" => facturas_compras::Column::FechaRecepcion, // Mapping to available date
                    "Estado Pago" => facturas_compras::Column::Estado,
                    _ => continue,
                };
                query = apply_filter(query, column, operator, value);
            }

            let invoices = query.find_also_related(proveedores::Entity).all(db).await?;
            
            for (invoice, provider) in invoices {
                let provider_name = provider.map(|p| p.nombre_proveedor).unwrap_or("Desconocido".to_string());
                results.push(serde_json::json!({
                    "N° Factura": invoice.numero_factura,
                    "Proveedor": provider_name,
                    "Fecha Emisión": invoice.fecha_emision,
                    "Fecha Vencimiento": invoice.fecha_recepcion, // Placeholder
                    "Monto Total": invoice.total.to_string(),
                    "Estado Pago": invoice.estado,
                    "Notas": invoice.notas.unwrap_or_default(),
                    "Fecha Recepción": invoice.fecha_recepcion,
                }));
            }
        },
        _ => return Err(AppError::BadRequest("Invalid report type".to_string())),
    }

    Ok(results)
}

fn apply_filter<E, C>(query: Select<E>, column: C, operator: &str, value: &str) -> Select<E>
where
    E: EntityTrait,
    C: ColumnTrait,
{
    // Tentative helper to handle parsing and filtering
    let sea_val: sea_orm::Value = if let Ok(n) = value.parse::<i32>() {
        n.into()
    } else if let Ok(d) = value.parse::<f64>() {
        d.into()
    } else if let Ok(dt) = NaiveDate::parse_from_str(value, "%Y-%m-%d") {
        dt.into()
    } else {
        value.to_string().into()
    };

    match operator {
        "eq" => query.filter(column.eq(sea_val)),
        "neq" => query.filter(column.ne(sea_val)),
        "contains" => query.filter(column.contains(value)), // Contains works only on strings
        "gt" => query.filter(column.gt(sea_val)),
        "lt" => query.filter(column.lt(sea_val)),
        _ => query,
    }
}


pub async fn execute_scheduled_report(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    // 1. Fetch Report
    let report = reportes_programados::Entity::find_by_id(id)
        .one(&db)
        .await?;

    let report = report.ok_or_else(|| AppError::NotFound("Report not found".to_string()))?;

    // 2. Process Dynamic Filters
    let mut filters_json = report.filtros.clone().unwrap_or(serde_json::json!({}));
    
    if let Some(dynamic_range) = filters_json.get("dynamic_date_range").and_then(|v| v.as_str()) {
        let now = chrono::Utc::now();
        let today = now.date_naive();
        let (start_date, end_date) = match dynamic_range {
            "last_7_days" => (today - chrono::Duration::days(7), today),
            "last_30_days" => (today - chrono::Duration::days(30), today),
            "current_month" => {
                let start = NaiveDate::from_ymd_opt(today.year(), today.month(), 1).unwrap();
                (start, today)
            },
            "previous_month" => {
                let month = today.month();
                let year = today.year();
                let (prev_month, prev_year) = if month == 1 { (12, year - 1) } else { (month - 1, year) };
                let start = NaiveDate::from_ymd_opt(prev_year, prev_month, 1).unwrap();
                
                // Get last day of previous month
                let next_month_start = if prev_month == 12 {
                    NaiveDate::from_ymd_opt(prev_year + 1, 1, 1).unwrap()
                } else {
                    NaiveDate::from_ymd_opt(prev_year, prev_month + 1, 1).unwrap()
                };
                let end = next_month_start - chrono::Duration::days(1);
                (start, end)
            },
            "current_year" => {
                let start = NaiveDate::from_ymd_opt(today.year(), 1, 1).unwrap();
                (start, today)
            },
            _ => (today, today) // Fallback
        };

        // Determine date field UI label based on report type
        let date_label = match report.tipo_reporte.as_str() {
            "Mantenimiento" => "Fecha Ejecución",
            "PlanMantenimiento" => "Fecha Programada",
            "Inventario" => "Fecha Última Compra",
            "OrdenesCompra" => "Fecha Solicitud",
            "Depreciación" => "Fecha Compra",
            "Activos" => "Fecha Compra",
            "OrdenesTrabajo" => "Fecha Inicio Real",
            "SugeridoCompra" => "Fecha Última Compra",
            "SolicitudesCotizacion" => "Fecha Solicitud",
            "FacturasCompra" => "Fecha Emisión",
             _ => "Fecha Ejecución"
        };
        
        if dynamic_range != "" {
             let mut conditions = filters_json.get("conditions")
                .and_then(|c| c.as_array())
                .cloned()
                .unwrap_or_default();
             
             // Add Start Date condition
             conditions.push(serde_json::json!({
                 "field": date_label,
                 "operator": "gt",
                 "value": start_date.to_string()
             }));

             // Add End Date condition
             conditions.push(serde_json::json!({
                 "field": date_label,
                 "operator": "lt",
                 "value": end_date.to_string()
             }));

             filters_json["conditions"] = serde_json::Value::Array(conditions);
        }
    }

    // 3. Generate Data
    let data = generate_report_data(&db, &report.tipo_reporte, Some(filters_json)).await?;

    // 3. Format Email Body
    let mut body = format!("<h1>Reporte: {}</h1>", report.nombre);
    body.push_str(&format!("<p>Tipo: {}</p>", report.tipo_reporte));
    body.push_str("<table border='1' cellspacing='0' cellpadding='5'>");
    
    if let Some(first) = data.first() {
        body.push_str("<thead><tr>");
        if let Some(obj) = first.as_object() {
            for key in obj.keys() {
                body.push_str(&format!("<th>{}</th>", key));
            }
        }
        body.push_str("</tr></thead>");
        
        body.push_str("<tbody>");
        for row in data {
            body.push_str("<tr>");
            if let Some(obj) = row.as_object() {
                for val in obj.values() {
                     let cell = match val {
                        serde_json::Value::String(s) => s.clone(),
                        serde_json::Value::Number(n) => n.to_string(),
                        serde_json::Value::Bool(b) => b.to_string(),
                        serde_json::Value::Null => "".to_string(),
                        _ => format!("{:?}", val),
                    };
                    body.push_str(&format!("<td>{}</td>", cell));
                }
            }
            body.push_str("</tr>");
        }
        body.push_str("</tbody>");
    } else {
        body.push_str("<p>No se encontraron datos para este reporte.</p>");
    }
    body.push_str("</table>");

    // 4. Send Email
    if let Some(destinatarios) = report.destinatarios {
        if !destinatarios.is_empty() {
             for email in destinatarios.split(',') {
                let email = email.trim();
                if !email.is_empty() {
                    // We ignore email errors for now to allow execution even if SMTP fails, 
                    // but logging it is good practice. Use crate::utils::mailer
                    let _ = crate::utils::mailer::send_email(
                        &db, 
                        email, 
                        &format!("Reporte Ejecutado: {}", report.nombre), 
                        &body
                    ).await.map_err(|e| tracing::error!("Error sending email to {}: {}", email, e));
                }
            }
        }
    }

    Ok(Json(serde_json::json!({ "status": "executed", "message": "Report executed and emails queued" })))
}
