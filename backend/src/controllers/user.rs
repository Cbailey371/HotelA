use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait};
use serde::{Deserialize, Serialize};
use crate::entities::usuarios;
use crate::utils::hash;

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub nombre: String,
    pub apellido: String,
    pub email: String,
    pub usuario: String,
    pub password: String,
    pub cargo: Option<String>,
    pub codigo_usuario: Option<String>,
}

#[derive(Serialize)]
pub struct UserDto {
    pub id: i32,
    pub nombre: String,
    pub apellido: String,
    pub email: String,
    pub usuario: String,
    pub cargo: Option<String>,
    pub estado: Option<String>,
    pub codigo: Option<String>,
}

pub async fn create_user(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let hashed_password = hash::hash_password(&payload.password)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    let new_user = usuarios::ActiveModel {
        nombre: Set(payload.nombre),
        apellido: Set(payload.apellido),
        email: Set(payload.email),
        usuario: Set(payload.usuario),
        password_hash: Set(hashed_password),
        cargo: Set(payload.cargo),
        estado: Set(Some("activo".to_string())),
        codigo_usuario: Set(payload.codigo_usuario),
        ..Default::default()
    };

    let user = new_user.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UserDto {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        usuario: user.usuario,
        cargo: user.cargo,
        estado: user.estado,
        codigo: user.codigo_usuario,
    }))
}

pub async fn get_users(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let users = usuarios::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let users_dto: Vec<UserDto> = users.into_iter().map(|u| UserDto {
        id: u.id_usuario,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        usuario: u.usuario,
        cargo: u.cargo,
        estado: u.estado,
        codigo: u.codigo_usuario,
    }).collect();

    Ok(Json(users_dto))
}
