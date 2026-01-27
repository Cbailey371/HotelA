use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QuerySelect, RelationTrait, JoinType};
use serde::{Deserialize, Serialize};
use crate::entities::{mantenimiento_calendario, mantenimiento_historial, mantenimiento_tipo, activos_equipos, tecnicos};
use chrono::NaiveDate;

#[derive(Deserialize)]
pub struct CreateScheduleRequest {
    pub equipo_id: i32,
    pub tipo_mantenimiento_id: i32,
    pub frecuencia: Option<String>,
    pub fecha_programada: Option<String>,
    pub responsable_id: Option<i32>,
    pub observaciones: Option<String>,
    pub codigo_mantenimiento: Option<String>,
    pub prioridad: Option<String>,
    pub costo_estimado: Option<f64>,
    pub dias_anticipacion: Option<i32>,
    pub proveedor_id: Option<i32>,
    pub tecnico_id: Option<i32>,
}

#[derive(Serialize)]
pub struct ScheduleDto {
    pub id: i32,
    pub equipo: String,
    pub tipo: String,
    pub fecha: Option<String>,
    pub estado: String,
    pub responsable: String,
    pub codigo: Option<String>,
    pub prioridad: String,
}

#[derive(Deserialize)]
pub struct ExecuteMaintenanceRequest {
    pub fecha_ejecucion: String,
    pub tecnico_id: i32,
    pub observaciones: Option<String>,
    pub horas_trabajo: f64,
    pub costo_mano_obra: f64,
}

pub async fn get_schedules(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let schedules = mantenimiento_calendario::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<ScheduleDto> = schedules.into_iter().map(|(s, e)| ScheduleDto {
        id: s.id_mantenimiento_calendario,
        equipo: e.map(|v| v.nombre_equipo).unwrap_or("N/A".to_string()),
        tipo: "Preventivo".to_string(), // Simplified for now
        fecha: s.fecha_programada.map(|d| d.to_string()),
        estado: s.estado.unwrap_or("programado".to_string()),
        responsable: "Asignado".to_string(),
        codigo: s.codigo_mantenimiento,
        prioridad: s.prioridad.unwrap_or("media".to_string()),
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_schedule(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateScheduleRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let fecha = payload.fecha_programada.and_then(|f| NaiveDate::parse_from_str(&f, "%Y-%m-%d").ok());
    
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    let new_schedule = mantenimiento_calendario::ActiveModel {
        equipo_id: Set(payload.equipo_id),
        tipo_mantenimiento_id: Set(payload.tipo_mantenimiento_id),
        frecuencia: Set(payload.frecuencia),
        fecha_programada: Set(fecha),
        responsable_id: Set(payload.responsable_id),
        observaciones: Set(payload.observaciones),
        estado: Set(Some("programado".to_string())),
        codigo_mantenimiento: Set(payload.codigo_mantenimiento),
        prioridad: Set(payload.prioridad),
        costo_estimado: Set(payload.costo_estimado.map(|c| Decimal::from_str(&c.to_string()).unwrap_or_default())),
        dias_anticipacion: Set(payload.dias_anticipacion),
        proveedor_id: Set(payload.proveedor_id),
        tecnico_id: Set(payload.tecnico_id),
        ..Default::default()
    };

    let s = new_schedule.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(s.id_mantenimiento_calendario))
}

pub async fn execute_maintenance(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<ExecuteMaintenanceRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    // 1. Find schedule
    let schedule = mantenimiento_calendario::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Schedule not found".to_string()))?;

    let fecha_e = NaiveDate::parse_from_str(&payload.fecha_ejecucion, "%Y-%m-%d")
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid date format".to_string()))?;

    // 2. Create history record
    let history = mantenimiento_historial::ActiveModel {
        calendario_id: Set(Some(schedule.id_mantenimiento_calendario)),
        equipo_id: Set(Some(schedule.equipo_id)),
        tecnico_id: Set(Some(payload.tecnico_id)),
        fecha_ejecucion: Set(Some(fecha_e)),
        observaciones: Set(payload.observaciones),
        horas_trabajo: Set(Some(Decimal::from_str(&payload.horas_trabajo.to_string()).unwrap_or_default())),
        costo_mano_obra: Set(Some(Decimal::from_str(&payload.costo_mano_obra.to_string()).unwrap_or_default())),
        tipo_mantenimiento_id: Set(Some(schedule.tipo_mantenimiento_id)),
        ..Default::default()
    };

    history.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Update schedule status
    let mut schedule_active: mantenimiento_calendario::ActiveModel = schedule.into();
    schedule_active.estado = Set(Some("completado".to_string()));
    schedule_active.fecha_ultima_ejecucion = Set(Some(fecha_e));
    schedule_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Maintenance executed and recorded".to_string()))
}

pub async fn get_maintenance_types(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let types = mantenimiento_tipo::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(types))
}
