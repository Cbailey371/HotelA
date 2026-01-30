use axum::{Json, extract::State, response::IntoResponse};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{usuarios, roles, usuario_roles};
use crate::utils::{hash, jwt, error::AppError};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub usuario: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub usuario: UserResponse,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub username: String,
    pub nombre: Option<String>,
    pub apellido: Option<String>,
    pub cargo: Option<String>,
    pub role: String,
}

pub async fn login(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<LoginRequest>,
) ->  Result<impl IntoResponse, AppError> {
    // 1. Find user by username
    let user = usuarios::Entity::find()
        .filter(usuarios::Column::Usuario.eq(&payload.usuario))
        .filter(usuarios::Column::Estado.eq("activo"))
        .one(&db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Credenciales inválidas".to_string()))?;

    // 2. Verify password
    if !hash::verify_password(&payload.password, &user.password_hash) {
        return Err(AppError::Unauthorized("Credenciales inválidas".to_string()));
    }

    // 3. Get all user roles and prioritize SUPER-ADMIN
    let user_roles = usuario_roles::Entity::find()
        .filter(usuario_roles::Column::UsuarioId.eq(user.id_usuario))
        .find_also_related(roles::Entity)
        .all(&db)
        .await?;

    let mut role_name = "USUARIO".to_string();
    let has_super = user_roles.iter().any(|(_, r)| r.as_ref().map(|v| v.nombre_rol.as_str()) == Some("SUPER-ADMIN"));
    let has_admin = user_roles.iter().any(|(_, r)| r.as_ref().map(|v| v.nombre_rol.as_str()) == Some("ADMIN"));

    if has_super {
        role_name = "SUPER-ADMIN".to_string();
    } else if has_admin {
        role_name = "ADMIN".to_string();
    } else if let Some((_, Some(role))) = user_roles.first() {
        role_name = role.nombre_rol.clone();
    }

    // 4. Generate Token
    let token = jwt::generate_jwt(user.id_usuario, user.usuario.clone(), role_name.clone());

    // LOG AUDITORIA
    crate::utils::audit::log_action(
        &db, 
        user.id_usuario, 
        "LOGIN", 
        "usuarios", 
        Some(user.id_usuario), 
        Some(format!("Sesión iniciada por: {}", user.usuario)),
        None
    ).await;

    Ok(Json(LoginResponse {
        token,
        usuario: UserResponse {
            id: user.id_usuario,
            username: user.usuario,
            nombre: Some(user.nombre.clone()),
            apellido: Some(user.apellido.clone()),
            cargo: user.cargo,
            role: role_name,
        }
    }))
}
