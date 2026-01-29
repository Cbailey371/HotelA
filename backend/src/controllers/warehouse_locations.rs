use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryOrder, ColumnTrait, QueryFilter};
use crate::entities::bodega_ubicaciones;

pub async fn get_warehouse_locations(
    State(db): State<DatabaseConnection>,
    Path(bodega_id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let locations = bodega_ubicaciones::Entity::find()
        .filter(bodega_ubicaciones::Column::BodegaId.eq(bodega_id))
        .order_by_asc(bodega_ubicaciones::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(locations))
}

#[derive(serde::Deserialize)]
pub struct CreateLocationRequest {
    pub nombre: String,
    pub descripcion: Option<String>,
}

pub async fn create_warehouse_location(
    State(db): State<DatabaseConnection>,
    Path(bodega_id): Path<i32>,
    Json(payload): Json<CreateLocationRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_location = bodega_ubicaciones::ActiveModel {
        bodega_id: Set(bodega_id),
        nombre: Set(payload.nombre),
        descripcion: Set(payload.descripcion),
        ..Default::default()
    };

    let res = new_location.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(res))
}

pub async fn update_warehouse_location(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateLocationRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut location: bodega_ubicaciones::ActiveModel = bodega_ubicaciones::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Location not found".to_string()))?
        .into();

    location.nombre = Set(payload.nombre);
    location.descripcion = Set(payload.descripcion);
    
    let updated = location.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

pub async fn delete_warehouse_location(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    bodega_ubicaciones::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Location deleted"))
}
