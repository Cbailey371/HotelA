use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QuerySelect, RelationTrait, JoinType};
use serde::{Deserialize, Serialize};
use crate::entities::{orden_trabajo, activos_equipos, tecnicos, proveedores};

#[derive(Deserialize)]
pub struct CreateWorkOrderRequest {
    pub id_calendario: Option<i32>,
    pub id_activo: i32,
    pub id_tipo_mantenimiento: i32,
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub fecha_programada: String,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub codigo_ot: Option<String>,
}

pub async fn create_work_order(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateWorkOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Generate sequential code
    let next_code = crate::utils::code_generator::generate_next_code(&db, "orden_trabajo", "codigo_ot", "OT-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_ot = orden_trabajo::ActiveModel {
        id_calendario: Set(payload.id_calendario),
        id_activo: Set(payload.id_activo),
        id_tipo_mantenimiento: Set(Some(payload.id_tipo_mantenimiento)),
        id_tecnico: Set(payload.id_tecnico),
        id_proveedor: Set(payload.id_proveedor),
        prioridad: Set(payload.prioridad),
        observaciones: Set(payload.observaciones),
        codigo_ot: Set(Some(next_code)),
        estado: Set(Some("abierta".to_string())),
        ..Default::default()
    };

    let ot = new_ot.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ot.id_ot))
}

pub async fn get_work_orders(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ots = orden_trabajo::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Simplistic return for now, can be DTO'd later
    Ok(Json(ots))
}

#[derive(Deserialize)]
pub struct UpdateOtStatusRequest {
    pub estado: String,
}

pub async fn update_work_order_status(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateOtStatusRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    let mut ot_active: orden_trabajo::ActiveModel = ot.into();
    ot_active.estado = Set(Some(payload.estado));
    
    ot_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Status updated"))
}
