use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryOrder};
use crate::entities::bodegas;

pub async fn get_warehouses(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let warehouses = bodegas::Entity::find()
        .order_by_asc(bodegas::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(warehouses))
}

#[derive(serde::Deserialize)]
pub struct CreateWarehouseRequest {
    pub nombre: String,
    pub ubicacion: Option<String>,
    pub descripcion: Option<String>,
}

pub async fn create_warehouse(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateWarehouseRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_warehouse = bodegas::ActiveModel {
        nombre: Set(payload.nombre),
        ubicacion: Set(payload.ubicacion),
        descripcion: Set(payload.descripcion),
        ..Default::default()
    };

    let res = new_warehouse.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(res))
}

pub async fn update_warehouse(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateWarehouseRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut warehouse: bodegas::ActiveModel = bodegas::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Warehouse not found".to_string()))?
        .into();

    warehouse.nombre = Set(payload.nombre);
    warehouse.ubicacion = Set(payload.ubicacion);
    warehouse.descripcion = Set(payload.descripcion);
    
    let updated = warehouse.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

pub async fn delete_warehouse(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    bodegas::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Warehouse deleted"))
}
