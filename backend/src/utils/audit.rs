use sea_orm::{Set, ActiveModelTrait, ConnectionTrait};
use crate::entities::auditoria_acciones;
use chrono::Utc;

pub async fn log_action<C: ConnectionTrait>(
    db: &C,
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

pub async fn cleanup_old_logs<C: ConnectionTrait>(db: &C) -> Result<u64, sea_orm::DbErr> {
    use sea_orm::{EntityTrait, QueryFilter, ColumnTrait};
    use chrono::{Duration, Utc};
    
    let thirty_days_ago = Utc::now() - Duration::days(30);
    
    let result = auditoria_acciones::Entity::delete_many()
        .filter(auditoria_acciones::Column::Fecha.lt(thirty_days_ago))
        .exec(db)
        .await?;
        
    Ok(result.rows_affected)
}
