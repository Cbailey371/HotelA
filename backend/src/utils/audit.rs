use sea_orm::{DatabaseConnection, Set, ActiveModelTrait};
use crate::entities::auditoria_acciones;
use chrono::Utc;

pub async fn log_action(
    db: &DatabaseConnection,
    usuario_id: i32,
    accion: &str,
    tabla: &str,
    registro_id: Option<i32>,
    detalle: Option<String>,
    ip: Option<String>,
) {
    let new_log = auditoria_acciones::ActiveModel {
        usuario_id: Set(Some(usuario_id)),
        accion: Set(Some(accion.to_string())),
        tabla_afectada: Set(Some(tabla.to_string())),
        registro_id: Set(registro_id),
        fecha: Set(Some(Utc::now().into())),
        ip_origen: Set(ip),
        detalle: Set(detalle),
        ..Default::default()
    };

    let _ = new_log.insert(db).await;
}
