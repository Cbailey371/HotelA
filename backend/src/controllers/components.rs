use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, QueryOrder, Set, ActiveModelTrait};
use serde::{Deserialize, Serialize};
use crate::entities::componentes_estandar;

#[derive(Serialize)]
pub struct ComponenteDto {
    pub id: i32,
    pub nombre: String,
    pub categoria: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateComponenteRequest {
    pub nombre: String,
    pub categoria: Option<String>,
}

pub async fn get_componentes(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let componentes = componentes_estandar::Entity::find()
        .order_by_asc(componentes_estandar::Column::Categoria)
        .order_by_asc(componentes_estandar::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<ComponenteDto> = componentes.into_iter().map(|c| ComponenteDto {
        id: c.id,
        nombre: c.nombre,
        categoria: c.categoria,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_componente(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateComponenteRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_comp = componentes_estandar::ActiveModel {
        nombre: Set(payload.nombre),
        categoria: Set(payload.categoria),
        ..Default::default()
    };

    let comp = new_comp.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(comp.id))
}

pub async fn update_componente(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateComponenteRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let comp = componentes_estandar::Entity::find_by_id(id)
        .one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Component not found".to_string()))?;

    let mut comp_active: componentes_estandar::ActiveModel = comp.into();
    comp_active.nombre = Set(payload.nombre);
    comp_active.categoria = Set(payload.categoria);

    let _ = comp_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Updated"))
}

pub async fn delete_componente(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let comp = componentes_estandar::Entity::find_by_id(id)
        .one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Component not found".to_string()))?;

    let comp_active: componentes_estandar::ActiveModel = comp.into();
    let _ = comp_active.delete(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Deleted"))
}
