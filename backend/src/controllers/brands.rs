use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryOrder};
use crate::entities::marcas;
use crate::utils::{jwt, audit};

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
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateBrandRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_brand = marcas::ActiveModel {
        nombre: Set(payload.nombre.clone()),
        descripcion: Set(payload.descripcion.clone()),
        ..Default::default()
    };

    let res = new_brand.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "marcas", 
        Some(res.id), 
        Some(format!("Creada marca: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(res))
}

pub async fn update_brand(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateBrandRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let item = marcas::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Brand not found".to_string()))?;

    let mut item: marcas::ActiveModel = item.into();
    item.nombre = Set(payload.nombre.clone());
    item.descripcion = Set(payload.descripcion.clone());

    let updated = item.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "UPDATE", 
        "marcas", 
        Some(updated.id), 
        Some(format!("Actualizada marca: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(updated))
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
