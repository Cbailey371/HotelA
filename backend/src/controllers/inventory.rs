use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use axum_extra::extract::Multipart;
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QueryOrder};
use serde::{Deserialize, Serialize};
use crate::entities::{activos_repuestos, historial_repuestos, activos_equipos, mantenimiento_calendario};
use crate::utils::{jwt, audit};
use sea_orm::prelude::Decimal;
use std::str::FromStr;
use tokio::fs;
use uuid::Uuid;
use serde_json::json;
use chrono::NaiveDate;

#[derive(Deserialize)]
pub struct CreatePartRequest {
    pub nombre_repuesto: String,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub stock_actual: i32,
    pub stock_minimo: i32,
    pub unidad_medida: String,
    pub precio_unitario: f64,
    pub ubicacion_almacen: Option<String>,
    pub codigo_repuesto: Option<String>,
    pub proveedor_id: Option<i32>,
    pub ubicacion_detallada: Option<String>,
    pub fecha_vencimiento: Option<String>,
    pub compatibilidad: Option<String>,
    pub bodega_id: Option<i32>,
    pub ubicacion_bodega_id: Option<i32>,
}

#[derive(Serialize)]
pub struct PartDto {
    pub id: i32,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub stock: i32,
    pub stock_minimo: i32,
    pub unidad: String,
    pub precio: f64,
    pub ubicacion: Option<String>,
    pub codigo: Option<String>,
    pub imagen: Option<String>,
    pub ubicacion_detallada: Option<String>,
    pub proveedor_id: Option<i32>,
    pub fecha_vencimiento: Option<String>,
    pub compatibilidad: Option<String>,
    pub bodega_id: Option<i32>,
    pub ubicacion_bodega_id: Option<i32>,
}

pub async fn get_parts(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let parts = activos_repuestos::Entity::find()
        .order_by_asc(activos_repuestos::Column::CodigoRepuesto)
        .all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<PartDto> = parts.into_iter().map(|p| PartDto {
        id: p.id_repuesto,
        nombre: p.nombre_repuesto,
        descripcion: p.descripcion,
        categoria: p.tipo_repuesto,
        marca: p.marca,
        modelo: p.modelo,
        stock: p.stock_actual.unwrap_or(0),
        stock_minimo: p.stock_minimo.unwrap_or(0),
        unidad: p.unidad_medida.unwrap_or("unidades".to_string()),
        precio: p.costo_unitario.map(|v| v.to_string().parse().unwrap_or(0.0)).unwrap_or(0.0),
        ubicacion: p.ubicacion_almacen,
        codigo: Some(p.codigo_repuesto),
        imagen: p.imagen,
        ubicacion_detallada: p.ubicacion_fisica_exacta,
        proveedor_id: p.proveedor_id,
        fecha_vencimiento: p.fecha_vencimiento.map(|d| d.to_string()),
        compatibilidad: p.compatibilidad_modelos,
        bodega_id: p.bodega_id,
        ubicacion_bodega_id: p.ubicacion_bodega_id,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_part(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreatePartRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Generate sequential code (default prefix REP-)
    let next_code = crate::utils::code_generator::generate_next_code(&db, "activos_repuestos", "codigo_repuesto", "REP-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_part = activos_repuestos::ActiveModel {
        codigo_repuesto: Set(next_code),
        nombre_repuesto: Set(payload.nombre_repuesto),
        descripcion: Set(payload.descripcion),
        tipo_repuesto: Set(payload.categoria),
        marca: Set(payload.marca),
        modelo: Set(payload.modelo),
        stock_actual: Set(Some(payload.stock_actual)),
        stock_minimo: Set(Some(payload.stock_minimo)),
        unidad_medida: Set(Some(payload.unidad_medida)),
        costo_unitario: Set(Some(Decimal::from_str(&payload.precio_unitario.to_string()).unwrap_or_default())),
        ubicacion_almacen: Set(payload.ubicacion_almacen),
        proveedor_id: Set(payload.proveedor_id),
        ubicacion_fisica_exacta: Set(payload.ubicacion_detallada),
        fecha_vencimiento: Set(payload.fecha_vencimiento.and_then(|d| NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())),
        compatibilidad_modelos: Set(payload.compatibilidad),
        bodega_id: Set(payload.bodega_id),
        ubicacion_bodega_id: Set(payload.ubicacion_bodega_id),
        ..Default::default()
    };

    let p = new_part.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(PartDto {
        id: p.id_repuesto,
        nombre: p.nombre_repuesto,
        descripcion: p.descripcion,
        categoria: p.tipo_repuesto,
        marca: p.marca,
        modelo: p.modelo,
        stock: p.stock_actual.unwrap_or(0),
        stock_minimo: p.stock_minimo.unwrap_or(0),
        unidad: p.unidad_medida.unwrap_or_default(),
        precio: p.costo_unitario.map(|v| v.to_string().parse().unwrap_or(0.0)).unwrap_or(0.0),
        ubicacion: p.ubicacion_almacen,
        codigo: Some(p.codigo_repuesto),
        imagen: None,
        ubicacion_detallada: p.ubicacion_fisica_exacta,
        proveedor_id: p.proveedor_id,
        fecha_vencimiento: p.fecha_vencimiento.map(|d| d.to_string()),
        compatibilidad: p.compatibilidad_modelos,
        bodega_id: p.bodega_id,
        ubicacion_bodega_id: p.ubicacion_bodega_id,
    }))
}

pub async fn update_part(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<CreatePartRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut part: activos_repuestos::ActiveModel = activos_repuestos::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Part not found".to_string()))?
        .into();

    part.nombre_repuesto = Set(payload.nombre_repuesto);
    part.descripcion = Set(payload.descripcion);
    part.tipo_repuesto = Set(payload.categoria);
    part.marca = Set(payload.marca);
    part.modelo = Set(payload.modelo);
    part.stock_actual = Set(Some(payload.stock_actual));
    part.stock_minimo = Set(Some(payload.stock_minimo));
    part.unidad_medida = Set(Some(payload.unidad_medida));
    part.costo_unitario = Set(Some(Decimal::from_str(&payload.precio_unitario.to_string()).unwrap_or_default()));
    part.ubicacion_almacen = Set(payload.ubicacion_almacen);
    part.proveedor_id = Set(payload.proveedor_id);
    if let Some(v) = payload.ubicacion_detallada { part.ubicacion_fisica_exacta = Set(Some(v)); }
    if let Some(v) = payload.fecha_vencimiento { part.fecha_vencimiento = Set(NaiveDate::parse_from_str(&v, "%Y-%m-%d").ok()); }
    if let Some(v) = payload.compatibilidad { part.compatibilidad_modelos = Set(Some(v)); }
    part.bodega_id = Set(payload.bodega_id);
    part.ubicacion_bodega_id = Set(payload.ubicacion_bodega_id);

    let updated = part.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(PartDto {
        id: updated.id_repuesto,
        nombre: updated.nombre_repuesto,
        descripcion: updated.descripcion,
        categoria: updated.tipo_repuesto,
        marca: updated.marca,
        modelo: updated.modelo,
        stock: updated.stock_actual.unwrap_or(0),
        stock_minimo: updated.stock_minimo.unwrap_or(0),
        unidad: updated.unidad_medida.unwrap_or_default(),
        precio: updated.costo_unitario.map(|v| v.to_string().parse().unwrap_or(0.0)).unwrap_or(0.0),
        ubicacion: updated.ubicacion_almacen,
        codigo: Some(updated.codigo_repuesto),
        imagen: updated.imagen,
        ubicacion_detallada: updated.ubicacion_fisica_exacta,
        proveedor_id: updated.proveedor_id,
        fecha_vencimiento: updated.fecha_vencimiento.map(|d: NaiveDate| d.to_string()),
        compatibilidad: updated.compatibilidad_modelos,
        bodega_id: updated.bodega_id,
        ubicacion_bodega_id: updated.ubicacion_bodega_id,
    }))
}

pub async fn delete_part(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    activos_repuestos::Entity::delete_by_id(id).exec(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json("Part deleted".to_string()))
}

pub async fn upload_part_image(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Check if part exists
    let mut part: activos_repuestos::ActiveModel = activos_repuestos::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Part not found".to_string()))?
        .into();

    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        let name = field.name().unwrap_or("file").to_string();
        
        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown").to_string();
            let data = field.bytes().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            
            let ext = std::path::Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("png");
            let new_filename = format!("part_{}_{}.{}", id, Uuid::new_v4(), ext);
            let upload_path = format!("uploads/{}", new_filename);

            fs::write(&upload_path, data).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)))?;

            let url = format!("/uploads/{}", new_filename);
            part.imagen = Set(Some(url.clone()));
            part.update(&db).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            return Ok(Json(json!({
                "url": url
            })));
        }
    }

    Err((StatusCode::BAD_REQUEST, "No file provided".to_string()))
}

pub async fn get_inventory_template() -> impl IntoResponse {
    let csv_content = "\
nombre_repuesto,descripcion,categoria,marca,modelo,stock_actual,stock_minimo,unidad_medida,precio_unitario,ubicacion_almacen
Filtro de Aceite,Filtro para generador,Consumible,CAT,X100,10,2,unidades,45.50,A-01
Correa de Transmisión,Correa en V,Mecánico,Gates,B-52,5,1,unidades,12.00,B-02
";
    (
        [(axum::http::header::CONTENT_TYPE, "text/csv"), (axum::http::header::CONTENT_DISPOSITION, "attachment; filename=\"plantilla_inventario.csv\"")],
        csv_content,
    )
}

pub async fn import_inventory_csv(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut count = 0;
    
    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        if field.name() == Some("file") {
            let data = field.bytes().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            let mut reader = csv::Reader::from_reader(&data[..]);
            
            for result in reader.deserialize() {
                // Reuse CreatePartRequest for CSV rows, assuming columns match struct fields (mapped by serde)
                // Note: CSV headers must match struct field names exactly.
                let record: CreatePartRequest = result.map_err(|e| (StatusCode::BAD_REQUEST, format!("CSV format error: {}", e)))?;
                
                let new_part = activos_repuestos::ActiveModel {
                    codigo_repuesto: Set(format!("REP-{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0) % 100000)), // Simple unique code gen
                    nombre_repuesto: Set(record.nombre_repuesto),
                    descripcion: Set(record.descripcion),
                    tipo_repuesto: Set(record.categoria),
                    marca: Set(record.marca),
                    modelo: Set(record.modelo),
                    stock_actual: Set(Some(record.stock_actual)),
                    stock_minimo: Set(Some(record.stock_minimo)),
                    unidad_medida: Set(Some(record.unidad_medida)),
                    costo_unitario: Set(Some(Decimal::from_str(&record.precio_unitario.to_string()).unwrap_or_default())),
                    ubicacion_almacen: Set(record.ubicacion_almacen),
                    ..Default::default()
                };

                new_part.insert(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
                count += 1;
            }
        }
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "IMPORT", 
        "activos_repuestos", 
        None, 
        Some(format!("Importados {} repuestos vía CSV", count)),
        None
    ).await;

    Ok(Json(format!("Successfully imported {} parts", count)))
}
#[derive(Serialize)]
pub struct UsageHistoryDto {
    pub id: i32,
    pub fecha: String,
    pub equipo: String,
    pub cantidad: i32,
    pub tecnico: String,
    pub motivo: String,
}

pub async fn get_part_history(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let history = historial_repuestos::Entity::find()
        .filter(historial_repuestos::Column::RepuestoId.eq(id))
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<UsageHistoryDto> = history.into_iter().map(|(h, e)| UsageHistoryDto {
        id: h.id_historial_repuesto,
        fecha: h.fecha_uso.map(|d| d.to_string()).unwrap_or_else(|| h.created_at.map(|c| c.to_string()).unwrap_or_default()),
        equipo: e.map(|v| v.nombre_equipo).unwrap_or("General".to_string()),
        cantidad: h.cantidad_utilizada.unwrap_or(0),
        tecnico: h.tecnico_responsable.unwrap_or("No registrado".to_string()),
        motivo: h.motivo.unwrap_or("S/M".to_string()),
    }).collect();

    Ok(Json(dtos))
}
