use axum::{Json, extract::State, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{usuarios, roles, usuario_roles};
use crate::utils::{hash, jwt};

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
    pub nombre: String,
    pub apellido: String,
    pub cargo: Option<String>,
    pub role: String,
}

pub async fn login(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<LoginRequest>,
) ->  Result<impl IntoResponse, (StatusCode, String)> {
    // 1. Find user by username
    let user = usuarios::Entity::find()
        .filter(usuarios::Column::Usuario.eq(&payload.usuario))
        .filter(usuarios::Column::Estado.eq("activo"))
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::UNAUTHORIZED, "Invalid credentials".to_string()))?;

    // 2. Verify password
    if !hash::verify_password(&payload.password, &user.password_hash) {
        return Err((StatusCode::UNAUTHORIZED, "Invalid credentials".to_string()));
    }

    // 3. Get all user roles and prioritize SUPER-ADMIN
    let user_roles = usuario_roles::Entity::find()
        .filter(usuario_roles::Column::UsuarioId.eq(user.id_usuario))
        .find_also_related(roles::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let role_name = if user_roles.iter().any(|(_, r)| r.as_ref().map(|role| role.nombre_rol.as_str()) == Some("SUPER-ADMIN")) {
        "SUPER-ADMIN".to_string()
    } else if user_roles.iter().any(|(_, r)| r.as_ref().map(|role| role.nombre_rol.as_str()) == Some("ADMINISTRADOR")) {
        "ADMINISTRADOR".to_string()
    } else {
        user_roles.first()
            .and_then(|(_, r)| r.as_ref().map(|role| role.nombre_rol.clone()))
            .unwrap_or_else(|| "user".to_string())
    };

    tracing::info!("LOGIN - Usuario: {}, Nombre: {}, Rol: {}", user.usuario, user.nombre, role_name);

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
            nombre: user.nombre,
            apellido: user.apellido,
            cargo: user.cargo,
            role: role_name,
        }
    }))
}
