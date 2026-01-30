use axum::{Json, extract::State, response::IntoResponse};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{usuarios, roles, usuario_roles};
use crate::utils::{hash, jwt, error::AppError};

// ... (LoginRequest, LoginResponse, UserResponse se mantienen)

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

    // ... (lógica de role_name igual)

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
