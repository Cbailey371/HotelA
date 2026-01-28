use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use serde::{Deserialize, Serialize};
use crate::entities::{categorias_activos, tipos_activos, ubicaciones, mantenimiento_tareas};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryOrder};
use crate::utils::{jwt, audit};

#[derive(Deserialize)]
pub struct CreateConfigRequest {
    pub nombre: String,
    pub descripcion: Option<String>,
}

#[derive(Serialize)]
pub struct ConfigItemDto {
    pub id: i32,
    pub nombre: String,
    pub descripcion: Option<String>,
}

// Categories
pub async fn get_categories(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let items = categorias_activos::Entity::find()
        .order_by_asc(categorias_activos::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<ConfigItemDto> = items.into_iter().map(|i| ConfigItemDto {
        id: i.id,
        nombre: i.nombre,
        descripcion: i.descripcion,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_category(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateConfigRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_item = categorias_activos::ActiveModel {
        nombre: Set(payload.nombre.clone()),
        descripcion: Set(payload.descripcion),
        ..Default::default()
    };

    let saved = new_item.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "categorias_activos", 
        Some(saved.id), 
        Some(format!("Creada categoría: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(ConfigItemDto {
        id: saved.id,
        nombre: saved.nombre,
        descripcion: saved.descripcion,
    }))
}

pub async fn delete_category(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let result = categorias_activos::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Category not found".to_string()));
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "DELETE", 
        "categorias_activos", 
        Some(id), 
        Some("Eliminada categoría activos".to_string()),
        None
    ).await;

    Ok(Json("Category deleted".to_string()))
}

// Types
pub async fn get_types(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let items = tipos_activos::Entity::find()
        .order_by_asc(tipos_activos::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<ConfigItemDto> = items.into_iter().map(|i| ConfigItemDto {
        id: i.id,
        nombre: i.nombre,
        descripcion: i.descripcion,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_type(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateConfigRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_item = tipos_activos::ActiveModel {
        nombre: Set(payload.nombre.clone()),
        descripcion: Set(payload.descripcion),
        ..Default::default()
    };

    let saved = new_item.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "tipos_activos", 
        Some(saved.id), 
        Some(format!("Creado tipo activo: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(ConfigItemDto {
        id: saved.id,
        nombre: saved.nombre,
        descripcion: saved.descripcion,
    }))
}

pub async fn delete_type(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let result = tipos_activos::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Type not found".to_string()));
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "DELETE", 
        "tipos_activos", 
        Some(id), 
        Some("Eliminado tipo activo".to_string()),
        None
    ).await;

    Ok(Json("Type deleted".to_string()))
}

// Locations
pub async fn get_locations(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let items = ubicaciones::Entity::find()
        .order_by_asc(ubicaciones::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<ConfigItemDto> = items.into_iter().map(|i| ConfigItemDto {
        id: i.id,
        nombre: i.nombre,
        descripcion: i.descripcion,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_location(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateConfigRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_item = ubicaciones::ActiveModel {
        nombre: Set(payload.nombre.clone()),
        descripcion: Set(payload.descripcion),
        ..Default::default()
    };

    let saved = new_item.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "ubicaciones", 
        Some(saved.id), 
        Some(format!("Creada ubicación: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(ConfigItemDto {
        id: saved.id,
        nombre: saved.nombre,
        descripcion: saved.descripcion,
    }))
}

pub async fn delete_location(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let result = ubicaciones::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Location not found".to_string()));
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "DELETE", 
        "ubicaciones", 
        Some(id), 
        Some("Eliminada ubicación activos".to_string()),
        None
    ).await;

    Ok(Json("Location deleted".to_string()))
}

// Maintenance Tasks
pub async fn get_maintenance_tasks(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let items = mantenimiento_tareas::Entity::find()
        .order_by_asc(mantenimiento_tareas::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<ConfigItemDto> = items.into_iter().map(|i| ConfigItemDto {
        id: i.id,
        nombre: i.nombre,
        descripcion: i.descripcion,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_maintenance_task(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateConfigRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_item = mantenimiento_tareas::ActiveModel {
        nombre: Set(payload.nombre.clone()),
        descripcion: Set(payload.descripcion),
        ..Default::default()
    };

    let saved = new_item.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "mantenimiento_tareas", 
        Some(saved.id), 
        Some(format!("Creada tarea mantenimiento: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(ConfigItemDto {
        id: saved.id,
        nombre: saved.nombre,
        descripcion: saved.descripcion,
    }))
}

pub async fn delete_maintenance_task(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let result = mantenimiento_tareas::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Task not found".to_string()));
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "DELETE", 
        "mantenimiento_tareas", 
        Some(id), 
        Some("Eliminada tarea mantenimiento".to_string()),
        None
    ).await;

    Ok(Json("Task deleted".to_string()))
}
