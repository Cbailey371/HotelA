use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use axum_extra::extract::Multipart;
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::activos_repuestos;
use crate::utils::{jwt, audit};
use sea_orm::prelude::Decimal;
use std::str::FromStr;

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
}

pub async fn get_parts(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let parts = activos_repuestos::Entity::find().all(&db).await
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
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_part(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreatePartRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_part = activos_repuestos::ActiveModel {
        codigo_repuesto: Set(payload.codigo_repuesto.unwrap_or_else(|| format!("REP-{}", chrono::Utc::now().timestamp_millis() % 10000))),
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
