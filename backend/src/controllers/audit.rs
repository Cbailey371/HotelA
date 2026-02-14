use axum::{Json, extract::{State, Query}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, QueryOrder};
use serde::{Serialize, Deserialize};
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

#[derive(Deserialize)]
pub struct AuditFilter {
    pub usuario_id: Option<i32>,
    pub accion: Option<String>,
    pub desde: Option<String>,
    pub hasta: Option<String>,
}

pub async fn get_audit_logs(
    State(db): State<DatabaseConnection>,
    Query(filter): Query<AuditFilter>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // 1. Ejecutar limpieza automática
    let _ = crate::utils::audit::cleanup_old_logs(&db).await;

    use sea_orm::{EntityTrait, QueryFilter, ColumnTrait};

    let mut query = auditoria_acciones::Entity::find()
        .find_also_related(usuarios::Entity);

    // 2. Aplicarfiltros
    if let Some(uid) = filter.usuario_id {
        query = query.filter(auditoria_acciones::Column::UsuarioId.eq(uid));
    }

    if let Some(acc) = filter.accion {
        if !acc.is_empty() {
            query = query.filter(auditoria_acciones::Column::Accion.eq(acc));
        }
    }

    if let Some(desde) = filter.desde {
        if !desde.is_empty() {
            if let Ok(d) = chrono::DateTime::parse_from_rfc3339(&format!("{}T00:00:00Z", desde)) {
                query = query.filter(auditoria_acciones::Column::Fecha.gte(d));
            }
        }
    }

    if let Some(hasta) = filter.hasta {
        if !hasta.is_empty() {
            if let Ok(h) = chrono::DateTime::parse_from_rfc3339(&format!("{}T23:59:59Z", hasta)) {
                query = query.filter(auditoria_acciones::Column::Fecha.lte(h));
            }
        }
    }

    let logs = query
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
