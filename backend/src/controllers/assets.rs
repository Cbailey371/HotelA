use axum::{Json, extract::{State, Path}, response::IntoResponse, Extension};
use axum_extra::extract::Multipart;
use serde::{Deserialize, Serialize};
use crate::entities::{activos_equipos, mantenimiento_historial, historial_repuestos, activos_repuestos, tecnicos, activos_documentos};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QueryOrder, Condition, PaginatorTrait};
use crate::utils::{jwt, audit, code_generator::generate_next_code, error::AppError};

#[derive(Serialize)]
pub struct ImportResponse {
    pub message: String,
    pub created: usize,
    pub skipped: Vec<String>,
}

#[derive(Deserialize)]
pub struct CreateAssetRequest {
    // pub codigo_equipo: String, // This is technically unused in create as we generate it, but frontend sends it? Frontend sends empty now.
    // Actually wait, let's keep one.
    pub codigo_equipo: Option<String>, // Making it Option since backend generates it? Or Keep String if frontend sends dummy.
    pub codigo_administrativo: Option<String>,
    pub nombre_equipo: String,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub ubicacion: Option<String>,
    pub area_responsable: Option<String>,
    pub estado: Option<String>,
    pub imagen_url: Option<String>,
    pub tipo_activo: Option<String>,
    pub anio: Option<i32>,
    pub color: Option<String>,
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub manual_pdf: Option<String>,
    pub cantidad: Option<i32>,
    pub ubicacion_detallada: Option<String>,
    pub fecha_instalacion: Option<String>,
    pub fecha_adquisicion: Option<String>,
    pub proveedor_id: Option<i32>,
    pub valor_compra: Option<f64>,
    pub vida_util_meses: Option<i32>,
    pub garantia_meses: Option<i32>,
    pub observaciones: Option<String>,
    pub documentos: Option<Vec<AddDocumentRequest>>,
}

#[derive(Deserialize)]
pub struct UpdateAssetRequest {
    pub codigo_administrativo: Option<String>,
    pub nombre_equipo: Option<String>,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub ubicacion: Option<String>,
    pub area_responsable: Option<String>,
    pub estado: Option<String>,
    pub imagen_url: Option<String>,
    pub tipo_activo: Option<String>,
    pub anio: Option<i32>,
    pub color: Option<String>,
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub manual_pdf: Option<String>,
    pub cantidad: Option<i32>,
    pub ubicacion_detallada: Option<String>,
    pub fecha_instalacion: Option<String>,
    pub fecha_adquisicion: Option<String>,
    pub proveedor_id: Option<i32>,
    pub valor_compra: Option<f64>,
    pub vida_util_meses: Option<i32>,
    pub garantia_meses: Option<i32>,
    pub observaciones: Option<String>,
    pub _documentos: Option<Vec<AddDocumentRequest>>,
}

#[derive(Serialize)]
pub struct AssetDto {
    pub id: i32,
    pub nombre: String,
    pub nombre_equipo: String, // Alias para frontend
    pub codigo: String,
    pub codigo_equipo: String, // Alias para frontend
    pub codigo_administrativo: Option<String>,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub serie: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: Option<String>,
    pub imagen_url: Option<String>,
    pub tipo_activo: Option<String>,
    pub anio: Option<i32>,
    pub color: Option<String>,
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub manual_pdf: Option<String>,
    pub cantidad: Option<i32>,
    pub ubicacion_detallada: Option<String>,
    pub fecha_instalacion: Option<String>,
    pub fecha_adquisicion: Option<String>,
    pub proveedor_id: Option<i32>,
    pub proveedor_nombre: Option<String>,
    pub valor_compra: Option<f64>,
    pub vida_util_meses: Option<i32>,
    pub garantia_meses: Option<i32>,
    pub observaciones: Option<String>,
    pub historial: Vec<MaintenanceHistoryItem>,
    pub repuestos: Vec<SparePartHistoryItem>,
    pub documentos: Vec<DocumentoDto>,
    pub proximo_servicio: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DocumentoDto {
    pub id: i32,
    pub nombre_archivo: String,
    pub url_archivo: String,
    pub created_at: Option<String>,
}

#[derive(Deserialize)]
pub struct AddDocumentRequest {
    pub nombre_archivo: String,
    pub url_archivo: String,
}

#[derive(Serialize)]
pub struct MaintenanceHistoryItem {
    pub id: i32,
    pub fecha: String,
    pub tecnico: String,
    pub tarea: String,
    pub observaciones: Option<String>,
}

#[derive(Serialize)]
pub struct SparePartHistoryItem {
    pub id: i32,
    pub nombre: String,
    pub cantidad: i32,
    pub fecha: String,
}

pub async fn create_asset(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateAssetRequest>,
) -> Result<impl IntoResponse, AppError> {
    let codigo_equipo = generate_next_code(&db, "activos_equipos", "codigo_equipo", "ACT-").await?;

    let new_asset = activos_equipos::ActiveModel {
        codigo_equipo: Set(codigo_equipo),
        codigo_administrativo: Set(payload.codigo_administrativo),
        nombre_equipo: Set(payload.nombre_equipo.clone()),
        descripcion: Set(payload.descripcion),
        categoria: Set(payload.categoria),
        marca: Set(payload.marca),
        modelo: Set(payload.modelo),
        numero_serie: Set(payload.numero_serie),
        ubicacion: Set(payload.ubicacion),
        area_responsable: Set(payload.area_responsable),
        estado: Set(payload.estado.or(Some("activo".to_string()))),
        imagen_url: Set(payload.imagen_url),
        tipo_activo: Set(payload.tipo_activo),
        anio: Set(payload.anio),
        color: Set(payload.color),
        numero_motor: Set(payload.numero_motor),
        numero_chasis: Set(payload.numero_chasis),
        manual_pdf: Set(payload.manual_pdf),
        cantidad: Set(payload.cantidad),
        ubicacion_detallada: Set(payload.ubicacion_detallada),
        fecha_instalacion: Set(payload.fecha_instalacion.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())),
        fecha_adquisicion: Set(payload.fecha_adquisicion.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())),
        proveedor_id: Set(payload.proveedor_id),
        valor_compra: Set(payload.valor_compra.and_then(|v| rust_decimal::Decimal::from_f64_retain(v))),
        vida_util_meses: Set(payload.vida_util_meses),
        garantia_meses: Set(payload.garantia_meses),
        observaciones: Set(payload.observaciones),
        ..Default::default()
    };

    let asset = new_asset.insert(&db).await?;

    // Insert documents if any
    if let Some(docs) = payload.documentos {
        for doc_req in docs {
            let new_doc = activos_documentos::ActiveModel {
                activo_id: Set(asset.id_equipo),
                nombre_archivo: Set(doc_req.nombre_archivo),
                url_archivo: Set(doc_req.url_archivo),
                ..Default::default()
            };
            new_doc.insert(&db).await?;
        }
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "activos_equipos", 
        Some(asset.id_equipo), 
        Some(format!("Creado activo: {}", payload.nombre_equipo)),
        None
    ).await;

    // Fetch documents to return in DTO
    let documentos = crate::entities::activos_documentos::Entity::find()
        .filter(crate::entities::activos_documentos::Column::ActivoId.eq(asset.id_equipo))
        .all(&db)
        .await?;

    let proveedor_nombre = if let Some(p_id) = asset.proveedor_id {
        crate::entities::proveedores::Entity::find_by_id(p_id)
            .one(&db)
            .await?
            .map(|p| p.nombre_proveedor)
    } else {
        None
    };

    Ok(Json(map_asset_to_dto_full(asset, vec![], vec![], documentos, None, proveedor_nombre)))
}

fn map_asset_to_dto(a: activos_equipos::Model, historial: Vec<MaintenanceHistoryItem>, repuestos: Vec<SparePartHistoryItem>, proveedor_nombre: Option<String>) -> AssetDto {
    AssetDto {
        id: a.id_equipo,
        codigo: a.codigo_equipo.clone(),
        codigo_equipo: a.codigo_equipo.clone(),
        codigo_administrativo: a.codigo_administrativo,
        nombre: a.nombre_equipo.clone(),
        nombre_equipo: a.nombre_equipo,
        descripcion: a.descripcion,
        categoria: a.categoria,
        marca: a.marca,
        modelo: a.modelo,
        serie: a.numero_serie,
        ubicacion: a.ubicacion,
        estado: a.estado,
        imagen_url: a.imagen_url,
        tipo_activo: a.tipo_activo,
        anio: a.anio,
        color: a.color,
        numero_motor: a.numero_motor,
        numero_chasis: a.numero_chasis,
        manual_pdf: a.manual_pdf,
        cantidad: a.cantidad,
        ubicacion_detallada: a.ubicacion_detallada,
        fecha_instalacion: a.fecha_instalacion.map(|d| d.to_string()),
        fecha_adquisicion: a.fecha_adquisicion.map(|d| d.to_string()),
        proveedor_id: a.proveedor_id,
        proveedor_nombre,
        valor_compra: a.valor_compra.and_then(|v| rust_decimal::prelude::ToPrimitive::to_f64(&v)),
        vida_util_meses: a.vida_util_meses,
        garantia_meses: a.garantia_meses,
        observaciones: a.observaciones,
        historial,
        repuestos,
        documentos: vec![],
        proximo_servicio: None,
    }
}

fn map_asset_to_dto_full(
    a: activos_equipos::Model, 
    historial: Vec<MaintenanceHistoryItem>, 
    repuestos: Vec<SparePartHistoryItem>,
    documentos: Vec<activos_documentos::Model>,
    proximo_servicio: Option<String>,
    proveedor_nombre: Option<String>
) -> AssetDto {
    AssetDto {
        id: a.id_equipo,
        codigo: a.codigo_equipo.clone(),
        codigo_equipo: a.codigo_equipo,
        codigo_administrativo: a.codigo_administrativo,
        nombre: a.nombre_equipo.clone(),
        nombre_equipo: a.nombre_equipo,
        descripcion: a.descripcion,
        categoria: a.categoria,
        marca: a.marca,
        modelo: a.modelo,
        serie: a.numero_serie,
        ubicacion: a.ubicacion,
        estado: a.estado,
        imagen_url: a.imagen_url,
        tipo_activo: a.tipo_activo,
        anio: a.anio,
        color: a.color,
        numero_motor: a.numero_motor,
        numero_chasis: a.numero_chasis,
        manual_pdf: a.manual_pdf,
        cantidad: a.cantidad,
        ubicacion_detallada: a.ubicacion_detallada,
        fecha_instalacion: a.fecha_instalacion.map(|d| d.to_string()),
        fecha_adquisicion: a.fecha_adquisicion.map(|d| d.to_string()),
        proveedor_id: a.proveedor_id,
        proveedor_nombre,
        valor_compra: a.valor_compra.and_then(|v| rust_decimal::prelude::ToPrimitive::to_f64(&v)),
        vida_util_meses: a.vida_util_meses,
        garantia_meses: a.garantia_meses,
        observaciones: a.observaciones,
        historial,
        repuestos,
        documentos: documentos.into_iter().map(|d| DocumentoDto {
            id: d.id,
            nombre_archivo: d.nombre_archivo,
            url_archivo: d.url_archivo,
            created_at: d.created_at.map(|dt| dt.to_rfc3339()),
        }).collect(),
        proximo_servicio,
    }
}

pub async fn get_assets(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let assets = activos_equipos::Entity::find()
        .filter(activos_equipos::Column::Estado.ne("baja"))
        .order_by_asc(activos_equipos::Column::IdEquipo)
        .find_also_related(crate::entities::proveedores::Entity)
        .all(&db)
        .await?;

    let dtos: Vec<AssetDto> = assets.into_iter().map(|(a, p)| {
        map_asset_to_dto(a, vec![], vec![], p.map(|prov| prov.nombre_proveedor))
    }).collect();

    Ok(Json(dtos))
}

pub async fn get_asset_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!("Fetching asset by id: {}", id);
    let existing_asset = activos_equipos::Entity::find_by_id(id)
        .find_also_related(crate::entities::proveedores::Entity)
        .one(&db)
        .await
        .map_err(|e| {
            tracing::error!("Error finding asset: {}", e);
            AppError::Internal(e.to_string())
        })?
        .ok_or_else(|| AppError::NotFound("Activo no encontrado".to_string()))?;

    let asset = existing_asset.0;
    let proveedor_nombre = existing_asset.1.map(|p| p.nombre_proveedor);

    tracing::info!("Asset found, fetching maintenance history");

    let history_items = mantenimiento_historial::Entity::find()
        .filter(mantenimiento_historial::Column::EquipoId.eq(id))
        .find_also_related(tecnicos::Entity)
        .all(&db)
        .await?;

    tracing::info!("Maintenance history fetched (count: {}), fetching spare parts", history_items.len());

    let historial = history_items.into_iter().map(|(h, t)| MaintenanceHistoryItem {
        id: h.id_mantenimiento,
        fecha: h.fecha_ejecucion.map(|d| d.to_string()).unwrap_or_default(),
        tecnico: t.map(|v| format!("{} {}", v.nombre, v.apellido)).unwrap_or("N/A".to_string()),
        tarea: h.observaciones.clone().unwrap_or_default(),
        observaciones: h.observaciones,
    }).collect();

    let spare_items = historial_repuestos::Entity::find()
        .filter(historial_repuestos::Column::EquipoId.eq(id))
        .find_also_related(activos_repuestos::Entity)
        .all(&db)
        .await?;

    tracing::info!("Spare parts history fetched (count: {}), fetching documents", spare_items.len());

    let repuestos = spare_items.into_iter().map(|(h, r)| SparePartHistoryItem {
        id: h.id_historial_repuesto,
        nombre: r.map(|v| v.nombre_repuesto).unwrap_or("Desconocido".to_string()),
        cantidad: h.cantidad_utilizada.unwrap_or(0),
        fecha: h.fecha_uso.map(|d| d.to_string()).unwrap_or_default(),
    }).collect();

    let documentos = activos_documentos::Entity::find()
        .filter(activos_documentos::Column::ActivoId.eq(id))
        .all(&db)
        .await?;
        
    // Fetch Next Scheduled Maintenance
    use crate::entities::mantenimiento_calendario;
    use sea_orm::QueryOrder;
    
    let next_maintenance = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::EquipoId.eq(id))
        .filter(mantenimiento_calendario::Column::Estado.eq("programado"))
        .order_by_asc(mantenimiento_calendario::Column::FechaProgramada)
        .one(&db)
        .await?;
        
    let proximo_servicio = next_maintenance.and_then(|m| m.fecha_programada.map(|d| d.to_string()));

    tracing::info!("Documents fetched (count: {}), mapping to DTO", documentos.len());

    Ok(Json(map_asset_to_dto_full(asset, historial, repuestos, documentos, proximo_servicio, proveedor_nombre)))
}

pub async fn update_asset(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<UpdateAssetRequest>,
) -> Result<impl IntoResponse, AppError> {
    let mut asset: activos_equipos::ActiveModel = activos_equipos::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Activo no encontrado".to_string()))?
        .into();

    if let Some(v) = payload.codigo_administrativo { asset.codigo_administrativo = Set(Some(v)); }
    if let Some(v) = payload.nombre_equipo { asset.nombre_equipo = Set(v); }
    if let Some(v) = payload.descripcion { asset.descripcion = Set(Some(v)); }
    if let Some(v) = payload.categoria { asset.categoria = Set(Some(v)); }
    if let Some(v) = payload.marca { asset.marca = Set(Some(v)); }
    if let Some(v) = payload.modelo { asset.modelo = Set(Some(v)); }
    if let Some(v) = payload.numero_serie { asset.numero_serie = Set(Some(v)); }
    if let Some(v) = payload.ubicacion { asset.ubicacion = Set(Some(v)); }
    if let Some(v) = payload.area_responsable { asset.area_responsable = Set(Some(v)); }
    // Field-level permission check for critical fields (Status in Assets)
    let has_critical_perm = crate::middleware::auth::check_permission(&db, claims.user_id, "critical_fields_edit").await;

    if let Some(v) = payload.estado { 
        if !has_critical_perm {
            let existing = activos_equipos::Entity::find_by_id(id).one(&db).await?.unwrap();
            if existing.estado != Some(v.clone()) {
                return Err(AppError::Forbidden("No tiene permisos para modificar el estado del activo".to_string()));
            }
        }
        asset.estado = Set(Some(v)); 
    }
    if let Some(v) = payload.imagen_url { asset.imagen_url = Set(Some(v)); }

    if let Some(v) = payload.tipo_activo { asset.tipo_activo = Set(Some(v)); }
    if let Some(v) = payload.anio { asset.anio = Set(Some(v)); }
    if let Some(v) = payload.color { asset.color = Set(Some(v)); }
    if let Some(v) = payload.numero_motor { asset.numero_motor = Set(Some(v)); }
    if let Some(v) = payload.numero_chasis { asset.numero_chasis = Set(Some(v)); }
    if let Some(v) = payload.manual_pdf { asset.manual_pdf = Set(Some(v)); }
    if let Some(v) = payload.cantidad { asset.cantidad = Set(Some(v)); }
    if let Some(v) = payload.ubicacion_detallada { asset.ubicacion_detallada = Set(Some(v)); }
    if let Some(v) = payload.fecha_instalacion { asset.fecha_instalacion = Set(chrono::NaiveDate::parse_from_str(&v, "%Y-%m-%d").ok()); }
    if let Some(v) = payload.fecha_adquisicion { asset.fecha_adquisicion = Set(chrono::NaiveDate::parse_from_str(&v, "%Y-%m-%d").ok()); }
    if let Some(v) = payload.proveedor_id { asset.proveedor_id = Set(Some(v)); }
    if let Some(v) = payload.valor_compra { asset.valor_compra = Set(rust_decimal::Decimal::from_f64_retain(v)); }
    if let Some(v) = payload.vida_util_meses { asset.vida_util_meses = Set(Some(v)); }
    if let Some(v) = payload.garantia_meses { asset.garantia_meses = Set(Some(v)); }
    if let Some(v) = payload.observaciones { asset.observaciones = Set(Some(v)); }

    let updated = asset.update(&db).await?;

    let proveedor_nombre = if let Some(p_id) = updated.proveedor_id {
        crate::entities::proveedores::Entity::find_by_id(p_id)
            .one(&db)
            .await?
            .map(|p| p.nombre_proveedor)
    } else {
        None
    };

    let documentos = activos_documentos::Entity::find()
        .filter(activos_documentos::Column::ActivoId.eq(id))
        .all(&db)
        .await?;

    Ok(Json(map_asset_to_dto_full(updated, vec![], vec![], documentos, None, proveedor_nombre)))
}

pub async fn delete_asset(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
) -> Result<impl IntoResponse, AppError> {
    let mut asset: activos_equipos::ActiveModel = activos_equipos::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Activo no encontrado".to_string()))?
        .into();

    asset.estado = Set(Some("baja".to_string()));
    let asset_nombre = asset.nombre_equipo.clone().unwrap();

    asset.update(&db).await?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "DELETE_SOFT", 
        "activos_equipos", 
        Some(id), 
        Some(format!("Dado de baja activo: {}", asset_nombre)),
        None
    ).await;

    Ok(Json("Asset deleted (soft)".to_string()))
}

pub async fn import_assets_create(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let mut count = 0;
    let mut skipped = Vec::new();
    
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        if field.name() == Some("file") {
            let data = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            let mut reader = csv::Reader::from_reader(&data[..]);
            
            for result in reader.deserialize() {
                let record: CreateAssetRequest = match result {
                    Ok(r) => r,
                    Err(e) => {
                        skipped.push(format!("Error de formato en fila: {}", e));
                        continue;
                    }
                };

                let mut is_duplicate = false;
                let mut reason = String::new();

                // 1. By Serial Number
                if let Some(sn) = &record.numero_serie {
                    if !sn.trim().is_empty() {
                        let exists = activos_equipos::Entity::find().filter(activos_equipos::Column::NumeroSerie.eq(sn.clone())).count(&db).await? > 0;
                        if exists {
                            is_duplicate = true;
                            reason = format!("Número de serie '{}' ya existe", sn);
                        }
                    }
                }

                // 2. By Codigo Administrativo
                if !is_duplicate {
                    if let Some(ca) = &record.codigo_administrativo {
                        if !ca.trim().is_empty() {
                             let exists = activos_equipos::Entity::find().filter(activos_equipos::Column::CodigoAdministrativo.eq(ca.clone())).count(&db).await? > 0;
                             if exists {
                                is_duplicate = true;
                                reason = format!("Código Administrativo '{}' ya existe", ca);
                            }
                        }
                    }
                }

                // 3. By Name + Brand + Location
                if !is_duplicate {
                    let mut q = activos_equipos::Entity::find().filter(activos_equipos::Column::NombreEquipo.eq(record.nombre_equipo.clone()));
                    if let Some(marca) = &record.marca { q = q.filter(activos_equipos::Column::Marca.eq(marca.clone())); }
                    if let Some(loc) = &record.ubicacion { q = q.filter(activos_equipos::Column::Ubicacion.eq(loc.clone())); }
                    
                    let exists = q.count(&db).await? > 0;
                    if exists {
                        is_duplicate = true;
                        reason = "Coincidencia de Nombre, Marca y Ubicación".to_string();
                    }
                }

                if is_duplicate {
                     skipped.push(format!("{} - {}", record.nombre_equipo, reason));
                     continue;
                }
                
                let codigo_equipo = generate_next_code(&db, "activos_equipos", "codigo_equipo", "ACT-").await?;

                let mut active_model = activos_equipos::ActiveModel {
                    codigo_equipo: Set(codigo_equipo),
                    ..Default::default()
                };

                active_model.codigo_administrativo = Set(record.codigo_administrativo);
                active_model.nombre_equipo = Set(record.nombre_equipo);
                active_model.descripcion = Set(record.descripcion);
                active_model.categoria = Set(record.categoria);
                active_model.marca = Set(record.marca);
                active_model.modelo = Set(record.modelo);
                active_model.numero_serie = Set(record.numero_serie);
                active_model.ubicacion = Set(record.ubicacion);
                active_model.area_responsable = Set(record.area_responsable);
                active_model.estado = Set(record.estado.or(Some("activo".to_string())));
                active_model.imagen_url = Set(record.imagen_url);
                active_model.tipo_activo = Set(record.tipo_activo);
                active_model.anio = Set(record.anio);
                active_model.color = Set(record.color);
                active_model.numero_motor = Set(record.numero_motor);
                active_model.numero_chasis = Set(record.numero_chasis);
                active_model.manual_pdf = Set(record.manual_pdf);
                active_model.cantidad = Set(record.cantidad);
                active_model.ubicacion_detallada = Set(record.ubicacion_detallada);
                active_model.fecha_instalacion = Set(record.fecha_instalacion.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()));
                active_model.fecha_adquisicion = Set(record.fecha_adquisicion.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()));
                active_model.proveedor_id = Set(record.proveedor_id);
                active_model.valor_compra = Set(record.valor_compra.and_then(|v| rust_decimal::Decimal::from_f64_retain(v)));
                active_model.vida_util_meses = Set(record.vida_util_meses);
                active_model.garantia_meses = Set(record.garantia_meses);
                active_model.observaciones = Set(record.observaciones.clone());

                active_model.insert(&db).await?;
                count += 1;
            }
        }
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "IMPORT_CREATE", 
        "activos_equipos", 
        None, 
        Some(format!("Importados {} nuevos activos vía CSV. Omitidos: {}", count, skipped.len())),
        None
    ).await;

    Ok(Json(ImportResponse {
        message: format!("Proceso completado. {} creados, {} saltados.", count, skipped.len()),
        created: count,
        skipped,
    }))
}

pub async fn import_assets_update(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let mut count = 0;
    
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        if field.name() == Some("file") {
            let data = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            let mut reader = csv::Reader::from_reader(&data[..]);
            
            for result in reader.deserialize() {
                let record: CreateAssetRequest = result.map_err(|e| AppError::BadRequest(format!("CSV format error: {}", e)))?;
                
                // UPDATE REQUIRES CODE
                let codigo_equipo = record.codigo_equipo.clone().ok_or_else(|| AppError::BadRequest("Código de equipo es requerido para actualizar".to_string()))?;

                let existing = activos_equipos::Entity::find()
                    .filter(activos_equipos::Column::CodigoEquipo.eq(codigo_equipo.clone()))
                    .one(&db)
                    .await?;

                if let Some(asset) = existing {
                    let mut active_model: activos_equipos::ActiveModel = asset.into();

                    // Update fields if present in CSV (assuming CSV full update usually, but struct has Options)
                    // Since CreateAssetRequest has fields, we update:
                    if let Some(v) = record.codigo_administrativo { active_model.codigo_administrativo = Set(Some(v)); }
                    active_model.nombre_equipo = Set(record.nombre_equipo); // String in struct, assuming always present in CSV
                    active_model.descripcion = Set(record.descripcion);
                    active_model.categoria = Set(record.categoria);
                    active_model.marca = Set(record.marca);
                    active_model.modelo = Set(record.modelo);
                    active_model.numero_serie = Set(record.numero_serie);
                    active_model.ubicacion = Set(record.ubicacion);
                    active_model.area_responsable = Set(record.area_responsable);
                    if let Some(v) = record.estado { active_model.estado = Set(Some(v)); } // Use logic?
                    
                    // .. other fields
                    active_model.imagen_url = Set(record.imagen_url);
                    active_model.tipo_activo = Set(record.tipo_activo);
                    active_model.anio = Set(record.anio);
                    active_model.color = Set(record.color);
                    active_model.numero_motor = Set(record.numero_motor);
                    active_model.numero_chasis = Set(record.numero_chasis);
                    active_model.manual_pdf = Set(record.manual_pdf);
                    active_model.cantidad = Set(record.cantidad);
                    active_model.ubicacion_detallada = Set(record.ubicacion_detallada);
                    // Dates need parsing again
                     active_model.fecha_instalacion = Set(record.fecha_instalacion.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()));
                    active_model.fecha_adquisicion = Set(record.fecha_adquisicion.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()));
                    active_model.proveedor_id = Set(record.proveedor_id);
                    active_model.valor_compra = Set(record.valor_compra.and_then(|v| rust_decimal::Decimal::from_f64_retain(v)));
                    active_model.vida_util_meses = Set(record.vida_util_meses);
                    active_model.garantia_meses = Set(record.garantia_meses);
                    active_model.observaciones = Set(record.observaciones.clone());

                    active_model.update(&db).await?;
                    count += 1;
                } else {
                     // Log warning or error? For now ignore non-existent in update? or Error?
                     // Verify plan: "Updates only. Requires codigo_equipo. Errors if not found." -> Let's error or skip. 
                     // Bulk usually implies skipping errors? Let's skip and maybe log.
                     tracing::warn!("Asset with code {} not found for update", codigo_equipo);
                }
            }
        }
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "IMPORT_UPDATE", 
        "activos_equipos", 
        None, 
        Some(format!("Actualizados {} activos vía CSV", count)),
        None
    ).await;

    Ok(Json(format!("Successfully updated {} assets", count)))
}

pub async fn get_assets_template_create() -> impl IntoResponse {
    // No codigo_equipo in Create Template
    let csv_content = "\
codigo_administrativo,nombre_equipo,descripcion,categoria,marca,modelo,numero_serie,ubicacion,area_responsable,estado,imagen_url,tipo_activo,anio,color,numero_motor,numero_chasis,manual_pdf,cantidad,ubicacion_detallada,fecha_instalacion,fecha_adquisicion,proveedor_id,valor_compra,vida_util_meses,garantia_meses,observaciones
FIN-1001,Aire Acondicionado Central,Unidad de 5 toneladas,Climatización,Carrier,XJ-100,SN12345678,Piso 1,Mantenimiento,activo,,Equipo,2023,Blanco,,,651,1,Sala de Máquinas,2023-01-15,2023-01-10,,4500.00,120,24,Equipo vital
FIN-1002,Generador Eléctrico,Generador diesel 500kva,Energía,Cummins,C500,GEN987654,Sótano 2,Electricidad,activo,,Maquinaria,2022,Azul,,,321,1,Exterior B,2022-06-20,2022-06-05,,12000.00,240,36,Revisar semestralmente
";
    (
        [(axum::http::header::CONTENT_TYPE, "text/csv"), (axum::http::header::CONTENT_DISPOSITION, "attachment; filename=\"plantilla_activos_nuevo.csv\"")],
        csv_content,
    )
}

pub async fn get_assets_template_update() -> impl IntoResponse {
    // Includes codigo_equipo FIRST
    let csv_content = "\
codigo_equipo,codigo_administrativo,nombre_equipo,descripcion,categoria,marca,modelo,numero_serie,ubicacion,area_responsable,estado,imagen_url,tipo_activo,anio,color,numero_motor,numero_chasis,manual_pdf,cantidad,ubicacion_detallada,fecha_instalacion,fecha_adquisicion,proveedor_id,valor_compra,vida_util_meses,garantia_meses,observaciones
AIR-001,FIN-1001,Aire Acondicionado Central,Unidad de 5 toneladas,Climatización,Carrier,XJ-100,SN12345678,Piso 1,Mantenimiento,activo,,Equipo,2023,Blanco,,,651,1,Sala de Máquinas,2023-01-15,2023-01-10,,4500.00,120,24,Equipo vital
GEN-001,FIN-1002,Generador Eléctrico,Generador diesel 500kva,Energía,Cummins,C500,GEN987654,Sótano 2,Electricidad,activo,,Maquinaria,2022,Azul,,,321,1,Exterior B,2022-06-20,2022-06-05,,12000.00,240,36,Revisar semestralmente
";
    (
        [(axum::http::header::CONTENT_TYPE, "text/csv"), (axum::http::header::CONTENT_DISPOSITION, "attachment; filename=\"plantilla_activos_actualizar.csv\"")],
        csv_content,
    )
}

pub async fn add_asset_document(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<AddDocumentRequest>,
) -> Result<impl IntoResponse, AppError> {
    let new_doc = activos_documentos::ActiveModel {
        activo_id: Set(id),
        nombre_archivo: Set(payload.nombre_archivo),
        url_archivo: Set(payload.url_archivo),
        ..Default::default()
    };

    let doc = new_doc.insert(&db).await?;

    Ok(Json(doc))
}

pub async fn delete_asset_document(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    activos_documentos::Entity::delete_by_id(id)
        .exec(&db)
        .await?;

    Ok(Json("Documento eliminado".to_string()))
}
