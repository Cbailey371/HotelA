use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::tecnicos;
use sea_orm::prelude::Decimal;

#[derive(Deserialize)]
pub struct TechnicianRequest {
    pub nombre: String,
    pub apellido: String,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub especialidad: Option<String>,
    pub proveedor_id: Option<i32>,
    pub es_independiente: bool,
    pub costo_hora: Option<Decimal>,
    pub estado: Option<String>,
    pub codigo_tecnico: Option<String>,
}

#[derive(Serialize)]
pub struct TechnicianDto {
    pub id: i32,
    pub nombre: String,
    pub apellido: String,
    pub especialidad: Option<String>,
    pub es_independiente: bool,
    pub proveedor_id: Option<i32>,
    pub costo_hora: Option<Decimal>,
    pub estado: String,
    pub codigo: Option<String>,
}

pub async fn get_technicians(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let list = tecnicos::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<TechnicianDto> = list.into_iter().map(|t| TechnicianDto {
        id: t.id_tecnico,
        nombre: t.nombre,
        apellido: t.apellido,
        especialidad: t.especialidad,
        es_independiente: t.es_independiente,
        proveedor_id: t.proveedor_id,
        costo_hora: t.costo_hora,
        estado: t.estado,
        codigo: t.codigo_tecnico,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_technician(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<TechnicianRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Generate sequential code
    let next_code = crate::utils::code_generator::generate_next_code(&db, "tecnicos", "codigo_tecnico", "TEC-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_tech = tecnicos::ActiveModel {
        nombre: Set(payload.nombre),
        apellido: Set(payload.apellido),
        telefono: Set(payload.telefono),
        email: Set(payload.email),
        especialidad: Set(payload.especialidad),
        proveedor_id: Set(payload.proveedor_id),
        es_independiente: Set(payload.es_independiente),
        costo_hora: Set(payload.costo_hora),
        estado: Set(payload.estado.unwrap_or("activo".to_string())),
        codigo_tecnico: Set(Some(next_code)),
        ..Default::default()
    };

    let t = new_tech.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(TechnicianDto {
        id: t.id_tecnico,
        nombre: t.nombre,
        apellido: t.apellido,
        especialidad: t.especialidad,
        es_independiente: t.es_independiente,
        proveedor_id: t.proveedor_id,
        costo_hora: t.costo_hora,
        estado: t.estado,
        codigo: t.codigo_tecnico,
    }))
}

pub async fn update_technician(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<TechnicianRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut tech: tecnicos::ActiveModel = tecnicos::Entity::find_by_id(id)
        .one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Technician not found".to_string()))?
        .into();

    tech.nombre = Set(payload.nombre);
    tech.apellido = Set(payload.apellido);
    tech.telefono = Set(payload.telefono);
    tech.email = Set(payload.email);
    tech.especialidad = Set(payload.especialidad);
    tech.proveedor_id = Set(payload.proveedor_id);
    tech.es_independiente = Set(payload.es_independiente);
    tech.costo_hora = Set(payload.costo_hora);
    if let Some(st) = payload.estado { tech.estado = Set(st); }
    tech.codigo_tecnico = Set(payload.codigo_tecnico);

    let updated = tech.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(TechnicianDto {
        id: updated.id_tecnico,
        nombre: updated.nombre,
        apellido: updated.apellido,
        especialidad: updated.especialidad,
        es_independiente: updated.es_independiente,
        proveedor_id: updated.proveedor_id,
        costo_hora: updated.costo_hora,
        estado: updated.estado,
        codigo: updated.codigo_tecnico,
    }))
}

pub async fn delete_technician(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut tech: tecnicos::ActiveModel = tecnicos::Entity::find_by_id(id)
        .one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Technician not found".to_string()))?
        .into();

    tech.estado = Set("inactivo".to_string());
    tech.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Technician inactivated".to_string()))
}
