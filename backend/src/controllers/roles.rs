use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, ModelTrait, LoaderTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{roles, permisos, rol_permisos};

#[derive(Serialize)]
pub struct PermissionDto {
    pub id: i32,
    pub codigo: String,
    pub descripcion: Option<String>,
    pub modulo: Option<String>,
}

#[derive(Serialize)]
pub struct RoleDto {
    pub id: i32,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub permisos: Vec<String>, // List of permission codes
}

#[derive(Deserialize)]
pub struct CreateRoleRequest {
    pub nombre: String,
    pub descripcion: Option<String>,
    pub permisos: Vec<i32>, // List of permission IDs
}

pub async fn get_permissions(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let perms = permisos::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<PermissionDto> = perms.into_iter().map(|p| PermissionDto {
        id: p.id_permiso,
        codigo: p.codigo_permiso,
        descripcion: p.descripcion,
        modulo: p.modulo,
    }).collect();

    Ok(Json(dtos))
}

pub async fn get_roles(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let roles_list = roles::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Load permissions for each role
    // This could be optimized with a join or loader, but considering low volume of roles, N+1 query per role or loop is acceptable for MVP,
    // actually SeaORM loader is better.
    let permissions = roles_list.load_many_to_many(permisos::Entity, rol_permisos::Entity, &db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut role_dtos = Vec::new();
    for (role, perms) in roles_list.into_iter().zip(permissions.into_iter()) {
        role_dtos.push(RoleDto {
            id: role.id_rol,
            nombre: role.nombre_rol,
            descripcion: role.descripcion,
            permisos: perms.into_iter().map(|p| p.codigo_permiso).collect(),
        });
    }

    Ok(Json(role_dtos))
}

pub async fn create_role(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateRoleRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // 1. Create Role
    let new_role = roles::ActiveModel {
        nombre_rol: Set(payload.nombre),
        descripcion: Set(payload.descripcion),
        estado: Set(Some("activo".to_string())),
        ..Default::default()
    };

    let inserted_role = new_role.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Assign Permissions
    for perm_id in payload.permisos {
        let rel = rol_permisos::ActiveModel {
            rol_id: Set(inserted_role.id_rol),
            permiso_id: Set(perm_id),
            ..Default::default()
        };
        rel.insert(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // Return created role with permissions (for simplicity, we can just return the ID or fetch it again)
    // Let's return the basic info + empty permissions list if create was successful, or fetch full DTO?
    // Returning simple confirmation or ID is often enough, checking implementation plan... 
    // Plan doesn't specify return, but JSON is good.
    
    Ok(Json(inserted_role.id_rol))
}

pub async fn update_role(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateRoleRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // 1. Update basic info
    let mut role: roles::ActiveModel = roles::Entity::find_by_id(id)
        .one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Role not found".to_string()))?
        .into();

    role.nombre_rol = Set(payload.nombre);
    role.descripcion = Set(payload.descripcion);
    
    role.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Update Permissions (Delete all and re-insert)
    rol_permisos::Entity::delete_many()
        .filter(rol_permisos::Column::RolId.eq(id))
        .exec(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for perm_id in payload.permisos {
        let rel = rol_permisos::ActiveModel {
            rol_id: Set(id),
            permiso_id: Set(perm_id),
            ..Default::default()
        };
        rel.insert(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(Json("Role updated"))
}

pub async fn delete_role(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Check if roles has users assigned? DB constraints might handle this, but friendly error is better.
    // For now, let's just try delete and catch constraint error if any.
    // Note: We need to delete rol_permisos first usually, or use cascade.
    // Let's trust SeaORM or delete manually.
    
    // Delete relations first
    rol_permisos::Entity::delete_many()
        .filter(rol_permisos::Column::RolId.eq(id))
        .exec(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Delete role
    roles::Entity::delete_by_id(id).exec(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Role deleted"))
}
