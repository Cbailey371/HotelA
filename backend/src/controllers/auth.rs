use axum::{Json, extract::State, response::IntoResponse};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, JoinType, RelationTrait, QuerySelect};
use serde::{Deserialize, Serialize};
use crate::entities::{usuarios, roles, usuario_roles, rol_permisos, permisos};
use crate::utils::{hash, jwt, error::AppError};

#[derive(Deserialize)]
pub struct LoginRequest {
    #[serde(alias = "username")]
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
    pub permisos: Vec<String>,
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
    
    for (_, role_opt) in &user_roles {
        if let Some(role) = role_opt {
            if role.nombre_rol == "SUPER-ADMIN" {
                role_name = "SUPER-ADMIN".to_string();
                break;
            } else if role.nombre_rol == "ADMIN" && role_name != "SUPER-ADMIN" {
                role_name = "ADMIN".to_string();
            } else if role_name == "USUARIO" {
                role_name = role.nombre_rol.clone();
            }
        }
    }

    // 4. Get permissions for the token
    let role_ids: Vec<i32> = user_roles.iter()
        .filter_map(|(_, r)| r.as_ref())
        .map(|r| r.id_rol)
        .collect();
    
    let user_permissions: Vec<String> = if role_ids.is_empty() {
        Vec::new()
    } else {
        permisos::Entity::find()
            .join(JoinType::InnerJoin, permisos::Relation::RolPermisos.def())
            .filter(rol_permisos::Column::RolId.is_in(role_ids))
            .all(&db).await
            .unwrap_or_default()
            .into_iter()
            .map(|p| p.codigo_permiso)
            .collect::<std::collections::HashSet<String>>()
            .into_iter()
            .collect()
    };

    // 5. Generate Token with Permissions
    let token = jwt::generate_jwt(user.id_usuario, user.usuario.clone(), role_name.clone(), user_permissions.clone());

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
            permisos: user_permissions,
        }
    }))
}
