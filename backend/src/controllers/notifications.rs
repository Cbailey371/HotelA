use axum::{Json, extract::State, response::IntoResponse};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, QueryOrder};
use serde::Serialize;
use crate::entities::{activos_equipos, mantenimiento_calendario, activos_repuestos, orden_trabajo, compras_solicitudes, mantenimiento_historial};
use chrono::{Local, Duration};
use crate::utils::error::AppError;

#[derive(Serialize)]
pub struct NotificationAlert {
    pub id: String,
    pub category: String, // "stock", "maintenance", "assets", "work_orders", "purchases", "warranty"
    pub title: String,
    pub message: String,
    pub date: Option<String>,
    pub priority: String, // "high", "medium", "low"
    pub link: Option<String>,
}

pub async fn get_alerts(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let mut alerts = Vec::new();
    let today = Local::now().date_naive();
    let next_week = today + Duration::days(7);
    let next_month = today + Duration::days(30);
    let three_months_ago = today - Duration::days(90);

    // 1. Stock Mínimo
    let low_stock = activos_repuestos::Entity::find()
        .all(&db)
        .await?
        .into_iter()
        .filter(|p| {
            let actual = p.stock_actual.unwrap_or(0);
            let minimo = p.stock_minimo.unwrap_or(0);
            actual <= minimo && minimo > 0
        })
        .collect::<Vec<_>>();

    for item in low_stock {
        alerts.push(NotificationAlert {
            id: format!("stock-{}", item.id_repuesto),
            category: "stock".to_string(),
            title: "Stock Crítico".to_string(),
            message: format!("{}: Quedan {} (mínimo {})", item.nombre_repuesto, item.stock_actual.unwrap_or(0), item.stock_minimo.unwrap_or(0)),
            date: None,
            priority: "high".to_string(),
            link: Some("/inventory".to_string()),
        });
    }

    // 2. Mantenimientos Próximos (7 días)
    let upcoming_maint = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::Estado.ne("completado"))
        .filter(mantenimiento_calendario::Column::Estado.ne("cancelado"))
        .filter(mantenimiento_calendario::Column::FechaProgramada.gte(today))
        .filter(mantenimiento_calendario::Column::FechaProgramada.lte(next_week))
        .all(&db)
        .await?;

    for maint in upcoming_maint {
        alerts.push(NotificationAlert {
            id: format!("maint-{}", maint.id_mantenimiento_calendario),
            category: "maintenance".to_string(),
            title: "Mantenimiento Próximo".to_string(),
            message: format!("Mantenimiento pendiente para {} el {}", maint.codigo_mantenimiento.unwrap_or_default(), maint.fecha_programada.unwrap_or(today)),
            date: maint.fecha_programada.map(|d| d.to_string()),
            priority: if maint.prioridad.as_deref() == Some("alta") { "high".to_string() } else { "medium".to_string() },
            link: Some("/maintenance".to_string()),
        });
    }

    // 3. Activos sin mantenimiento (>3 meses)
    // Buscamos activos cuyo último mantenimiento (en historial o calendario completado) sea hace más de 3 meses
    // O que nunca hayan tenido uno.
    let assets = activos_equipos::Entity::find()
        .filter(activos_equipos::Column::Estado.eq("activo"))
        .all(&db)
        .await?;

    for asset in assets {
        // Chequear historial
        let last_hist = mantenimiento_historial::Entity::find()
            .filter(mantenimiento_historial::Column::EquipoId.eq(asset.id_equipo))
            .order_by_desc(mantenimiento_historial::Column::FechaEjecucion)
            .one(&db)
            .await?;

        let last_date = last_hist.and_then(|h| h.fecha_ejecucion);
        
        if last_date.is_none() || last_date.unwrap() < three_months_ago {
             alerts.push(NotificationAlert {
                id: format!("neglected-{}", asset.id_equipo),
                category: "assets".to_string(),
                title: "Activo Desatendido".to_string(),
                message: format!("{}: Sin mantenimiento en más de 3 meses", asset.nombre_equipo),
                date: last_date.map(|d| d.to_string()),
                priority: "medium".to_string(),
                link: Some(format!("/assets/{}", asset.id_equipo)),
            });
        }
    }

    // 4. Órdenes de Trabajo Atrasadas (vencidas según calendario)
    let overdue_ots = orden_trabajo::Entity::find()
        .find_also_related(mantenimiento_calendario::Entity)
        .filter(orden_trabajo::Column::Estado.ne("completada"))
        .filter(orden_trabajo::Column::Estado.ne("cancelada"))
        .filter(mantenimiento_calendario::Column::FechaProgramada.lt(today))
        .all(&db)
        .await?;

    for (ot, cal) in overdue_ots {
        let date_str = cal.as_ref().and_then(|c| c.fecha_programada.map(|d| d.to_string()));
        alerts.push(NotificationAlert {
            id: format!("ot-overdue-{}", ot.id_ot),
            category: "work_orders".to_string(),
            title: "OT Atrasada".to_string(),
            message: format!("La {} venció el {}", ot.codigo_ot.unwrap_or_default(), 
                cal.and_then(|c| c.fecha_programada.map(|d| d.to_string())).unwrap_or_else(|| today.to_string())),
            date: date_str,
            priority: "high".to_string(),
            link: Some("/work-orders".to_string()),
        });
    }

    // 5. Solicitudes de Compra Pendientes
    let pending_reqs = compras_solicitudes::Entity::find()
        .filter(compras_solicitudes::Column::Estado.eq("pendiente"))
        .all(&db)
        .await?;

    if !pending_reqs.is_empty() {
        alerts.push(NotificationAlert {
            id: "purchases-pending".to_string(),
            category: "purchases".to_string(),
            title: "Compras Pendientes".to_string(),
            message: format!("Tienes {} solicitudes de compra esperando revisión", pending_reqs.len()),
            date: None,
            priority: "medium".to_string(),
            link: Some("/purchases/requests".to_string()),
        });
    }

    // 6. Garantías / Vida Útil por Vencer (30 días)
    let expiring_warranty = activos_equipos::Entity::find()
        .filter(activos_equipos::Column::Estado.eq("activo"))
        .filter(activos_equipos::Column::FechaFinVidaUtil.is_not_null())
        .filter(activos_equipos::Column::FechaFinVidaUtil.gte(today))
        .filter(activos_equipos::Column::FechaFinVidaUtil.lte(next_month))
        .all(&db)
        .await?;

    for asset in expiring_warranty {
        alerts.push(NotificationAlert {
            id: format!("warranty-{}", asset.id_equipo),
            category: "warranty".to_string(),
            title: "Garantía/Vida Útil".to_string(),
            message: format!("{}: Vence el {}", asset.nombre_equipo, asset.fecha_fin_vida_util.unwrap()),
            date: asset.fecha_fin_vida_util.map(|d| d.to_string()),
            priority: "medium".to_string(),
            link: Some(format!("/assets/{}", asset.id_equipo)),
        });
    }

    Ok(Json(alerts))
}
