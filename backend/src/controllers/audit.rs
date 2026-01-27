use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, QueryOrder, QuerySelect, RelationTrait, JoinType};
use serde::Serialize;
use crate::entities::{auditoria_acciones, usuarios};

#[derive(Serialize)]
pub struct AuditLogDto {
    pub id: i32,
    pub usuario: String,
    pub accion: String,
    pub tabla: String,
    pub registro_id: Option<i32>,
    pub fecha: String,
    pub ip: Option<String>,
    pub detalle: Option<String>,
}

pub async fn get_audit_logs(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let logs = auditoria_acciones::Entity::find()
        .find_also_related(usuarios::Entity)
        .order_by_desc(auditoria_acciones::Column::Fecha)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<AuditLogDto> = logs.into_iter().map(|(l, u)| AuditLogDto {
        id: l.id_auditoria,
        usuario: u.map(|v| v.usuario).unwrap_or("Sistema".to_string()),
        accion: l.accion.unwrap_or_default(),
        tabla: l.tabla_afectada.unwrap_or_default(),
        registro_id: l.registro_id,
        fecha: l.fecha.map(|f| f.to_rfc3339()).unwrap_or_default(),
        ip: l.ip_origen,
        detalle: l.detalle,
    }).collect();

    Ok(Json(dtos))
}
