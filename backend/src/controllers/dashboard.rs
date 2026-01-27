use axum::{Json, extract::State, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, PaginatorTrait};
use serde::Serialize;
use crate::entities::{activos_equipos, mantenimiento_calendario, activos_repuestos, mantenimiento_historial};

#[derive(Serialize)]
pub struct DashboardStats {
    pub total_assets: u64,
    pub pending_maintenance: u64,
    pub low_stock_items: u64,
    pub completed_this_month: u64,
    pub total_maintenance_cost: f64,
}

pub async fn get_stats(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // 1. Total Active Assets
    let total_assets = activos_equipos::Entity::find()
        .filter(activos_equipos::Column::Estado.eq("activo"))
        .count(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Pending Maintenance
    let pending_maintenance = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::Estado.eq("pendiente"))
        .count(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Low Stock Items
    // Stock actual <= stock minimo
    let parts = activos_repuestos::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let low_stock_items = parts.into_iter()
        .filter(|p| p.stock_actual.unwrap_or(0) <= p.stock_minimo.unwrap_or(0))
        .count() as u64;

    // 4. Completed this month
    let completed = mantenimiento_historial::Entity::find().count(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 5. Costs (Aggregated)
    let history = mantenimiento_historial::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let total_cost = history.into_iter()
        .map(|h| {
            if let Some(cost) = h.costo_mano_obra {
                cost.to_string().parse::<f64>().unwrap_or(0.0)
            } else {
                0.0
            }
        })
        .sum();

    Ok(Json(DashboardStats {
        total_assets,
        pending_maintenance,
        low_stock_items,
        completed_this_month: completed,
        total_maintenance_cost: total_cost,
    }))
}
