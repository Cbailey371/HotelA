use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryOrder};
use crate::entities::marcas;

pub async fn get_brands(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let brands = marcas::Entity::find()
        .order_by_asc(marcas::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(brands))
}

#[derive(serde::Deserialize)]
pub struct CreateBrandRequest {
    pub nombre: String,
    pub descripcion: Option<String>,
}

pub async fn create_brand(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateBrandRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_brand = marcas::ActiveModel {
        nombre: Set(payload.nombre),
        descripcion: Set(payload.descripcion),
        ..Default::default()
    };

    let res = new_brand.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(res))
}

pub async fn delete_brand(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    marcas::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Brand deleted"))
}
