use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, ModelTrait, LoaderTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{usuarios, roles, usuario_roles};
use crate::utils::{hash, audit, jwt::Claims};

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub nombre: String,
    pub apellido: String,
    pub email: String,
    pub usuario: String,
    pub password: String,
    pub cargo: Option<String>,
    pub codigo_usuario: Option<String>,
    pub role_id: Option<i32>,
    pub estado: Option<String>,
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
    pub rol_nombre: Option<String>,
    pub rol_id: Option<i32>,
}

pub async fn create_user(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let hashed_password = hash::hash_password(&payload.password)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    // Generate sequential code
    let next_code = crate::utils::code_generator::generate_next_code(&db, "usuarios", "codigo_usuario", "USR-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_user = usuarios::ActiveModel {
        nombre: Set(payload.nombre.clone()),
        apellido: Set(payload.apellido.clone()),
        email: Set(payload.email.clone()),
        usuario: Set(payload.usuario.clone()),
        password_hash: Set(hashed_password),
        cargo: Set(payload.cargo.clone()),
        estado: Set(Some("activo".to_string())),
        codigo_usuario: Set(Some(next_code)),
        ..Default::default()
    };

    let user = new_user.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Assign Role if provided
    let mut rol_nombre = None;
    let mut rol_id_assinged = None;

    if let Some(rid) = payload.role_id {
        let rel = usuario_roles::ActiveModel {
            usuario_id: Set(user.id_usuario),
            rol_id: Set(rid),
            ..Default::default()
        };
        rel.insert(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        // Fetch role name for response
        let role = roles::Entity::find_by_id(rid).one(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        if let Some(r) = role {
            rol_nombre = Some(r.nombre_rol);
            rol_id_assinged = Some(r.id_rol);
        }
    }

    // Send Welcome Email if SMTP is configured
    // We don't block success if email fails, but we assume "smtp_host" check inside mailer handles it gracefully or returns error.
    // For MVP we log error.
    let email_body = format!(
        "Hola {} {},\n\nSe ha creado tu cuenta en el sistema HotelA.\n\nUsuario: {}\nContraseña: {}\n\nPor favor ingresa y cambia tu contraseña.",
        payload.nombre, payload.apellido, payload.usuario, payload.password
    );

    if let Err(e) = crate::utils::mailer::send_email(&db, &payload.email, "Bienvenido a HotelA - Credenciales de Acceso", &email_body).await {
        tracing::error!("Error enviando email de bienvenida: {}", e);
        // We could return a warning here but standard JSON response structure might not support it easily without changing DTO.
        // Admin sees the password in the UI anyway.
    }

    audit::log_action(
        &db,
        claims.user_id,
        "CREATE",
        "usuarios",
        Some(user.id_usuario),
        Some(format!("Usuario creado: {}", user.usuario)),
        None,
    ).await;

    Ok(Json(UserDto {
        id: user.id_usuario,
        nombre: user.nombre.clone(),
        apellido: user.apellido.clone(),
        email: user.email.clone(),
        usuario: user.usuario.clone(),
        cargo: user.cargo.clone(),
        estado: user.estado.clone(),
        codigo: user.codigo_usuario.clone(),
        rol_nombre,
        rol_id: rol_id_assinged,
    }))
}

pub async fn get_users(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let users = usuarios::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Load roles
    // We assume 1 role per user for simplified display, or take the first one
    let roles_list = users.load_many_to_many(roles::Entity, usuario_roles::Entity, &db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut users_dto: Vec<UserDto> = Vec::new();

    for (user, user_roles) in users.into_iter().zip(roles_list.into_iter()) {
        let first_role = user_roles.first();
        users_dto.push(UserDto {
            id: user.id_usuario,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            usuario: user.usuario,
            cargo: user.cargo,
            estado: user.estado,
            codigo: user.codigo_usuario,
            rol_nombre: first_role.map(|r| r.nombre_rol.clone()),
            rol_id: first_role.map(|r| r.id_rol),
        });
    }

    Ok(Json(users_dto))
}

pub async fn update_user(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut user: usuarios::ActiveModel = usuarios::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Usuario no encontrado".to_string()))?
        .into();

    user.nombre = Set(payload.nombre);
    user.apellido = Set(payload.apellido);
    user.email = Set(payload.email);
    user.usuario = Set(payload.usuario);
    user.cargo = Set(payload.cargo);
    user.codigo_usuario = Set(payload.codigo_usuario);
    
    if let Some(est) = payload.estado {
        user.estado = Set(Some(est));
    }

    if !payload.password.is_empty() {
        let hashed_password = hash::hash_password(&payload.password)
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
        user.password_hash = Set(hashed_password);
    }

    let updated = user.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Update Role Relation
    // Strategy: Delete existing roles for user and insert new one if provided
    // If payload.role_id is None, maybe we shouldn't delete? Or implies removing role?
    // Let's assume if it is sent (even null) verify logic. 
    // Usually in these simple forms, we send the selected role ID.
    
    // We will clear roles and re-assign.
    if let Some(rid) = payload.role_id {
        usuario_roles::Entity::delete_many()
            .filter(usuario_roles::Column::UsuarioId.eq(id))
            .exec(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let rel = usuario_roles::ActiveModel {
            usuario_id: Set(id),
            rol_id: Set(rid),
            ..Default::default()
        };
        rel.insert(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    } else {
        // If role_id is NOT provided (None), do we keep existing or clear?
        // Since it's Option in struct, it might be missing from JSON if not sent.
        // Frontend should send it.
        // If we want to allow "No role", we might need to handle explicit null vs missing.
        // For now, let's assume if we are updating user, we might be sending role_id if changed.
        // To be safe: if role_id is None, we don't change roles.
        // If user wants to clear role, we'd need a specific action or handle logic differently.
        // But implementation plan says "Update role".
    }
    
    audit::log_action(
        &db,
        claims.user_id,
        "UPDATE",
        "usuarios",
        Some(updated.id_usuario),
        Some(format!("Usuario actualizado: {}", updated.usuario.clone())),
        None,
    ).await;
    
    // Check current role for response
    let roles = updated.find_related(roles::Entity).all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let first_role = roles.first();

    Ok(Json(UserDto {
        id: updated.id_usuario,
        nombre: updated.nombre,
        apellido: updated.apellido,
        email: updated.email,
        usuario: updated.usuario,
        cargo: updated.cargo,
        estado: updated.estado,
        codigo: updated.codigo_usuario,
        rol_nombre: first_role.map(|r| r.nombre_rol.clone()),
        rol_id: first_role.map(|r| r.id_rol),
    }))
}

pub async fn delete_user(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let _user = usuarios::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Usuario no encontrado".to_string()))?;

    // Delete roles associations first
    usuario_roles::Entity::delete_many()
        .filter(usuario_roles::Column::UsuarioId.eq(id))
        .exec(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Attempt hard delete, if constraints fail, fallback to soft delete
    let delete_result = usuarios::Entity::delete_by_id(id).exec(&db).await;
    if delete_result.is_err() {
        let mut user_am: usuarios::ActiveModel = _user.into();
        user_am.estado = Set(Some("inactivo".to_string()));
        user_am.update(&db).await
            .map_err(|_e| (StatusCode::INTERNAL_SERVER_ERROR, format!("No se pudo eliminar el usuario porque tiene registros vinculados. Se intentó desactivar pero falló: {:?}", delete_result.err().unwrap())))?;
    }

    audit::log_action(
        &db,
        claims.user_id,
        "DELETE",
        "usuarios",
        Some(id),
        Some(format!("Usuario eliminado ID: {}", id)),
        None,
    ).await;

    Ok(StatusCode::NO_CONTENT)
}
