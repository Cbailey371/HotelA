use axum::{Json, extract::State, response::IntoResponse};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, PaginatorTrait, QuerySelect, QueryOrder};
use serde::Serialize;
use crate::entities::{activos_equipos, mantenimiento_calendario, activos_repuestos, mantenimiento_historial, orden_compra_repuesto, proveedores, orden_trabajo};
use chrono::{Local, NaiveDate, Datelike};
use std::collections::HashMap;
use crate::utils::error::AppError;

#[derive(Serialize)]
pub struct MonthlyCostDto {
    pub month: String,
    pub amount: f64,
}

#[derive(Serialize)]
pub struct UpcomingEventDto {
    pub id: i32,
    pub title: String,
    pub date: String,
    pub priority: String,
    pub type_name: String,
    pub asunto: Option<String>,
    pub equipo_nombre: String,
    pub codigo_mantenimiento: Option<String>,
    pub tiene_ot: bool,
    pub codigo_ot: Option<String>,
    pub proveedor_nombre: Option<String>,
}

#[derive(Serialize)]
pub struct LowStockItemDto {
    pub id: i32,
    pub name: String,
    pub current_stock: i32,
    pub min_stock: i32,
}

#[derive(Serialize)]
pub struct DashboardStats {
    pub total_assets: u64,
    pub active_maintenance: u64,
    pub pending_orders: u64,
    pub upcoming_events_7d: u64,
    pub monthly_costs: Vec<MonthlyCostDto>,
    pub daily_costs: Vec<MonthlyCostDto>,
    pub upcoming_maintenance: Vec<UpcomingEventDto>,
    pub low_stock_items: u64,
    pub low_stock_details: Vec<LowStockItemDto>,
    pub calendar_events: Vec<UpcomingEventDto>,
}

pub async fn get_stats(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    // 1. Total Active Assets (KPI 1)
    let total_assets = activos_equipos::Entity::find()
        .filter(activos_equipos::Column::Estado.eq("activo"))
        .count(&db)
        .await?;

    // 2. Active Maintenance (KPI 2 - En curso/Pendiente)
    let active_maintenance = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::Estado.is_in(vec!["pendiente", "programado", "en_proceso"]))
        .count(&db)
        .await?;

    // 3. Pending Purchase Orders (KPI 3 - Prioridad Alta/Pendientes)
    let pending_orders = orden_compra_repuesto::Entity::find()
        .filter(orden_compra_repuesto::Column::Estado.is_in(vec!["pendiente", "aprobada", "parcial"]))
        .count(&db)
        .await?;

    // 4. Upcoming Events (7 days) (KPI 4)
    let today = Local::now().date_naive();
    let next_week = today + chrono::Duration::days(7);
    
    let upcoming_events_7d = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::Estado.ne("completado"))
        .filter(mantenimiento_calendario::Column::Estado.ne("cancelado"))
        .filter(mantenimiento_calendario::Column::FechaProgramada.gte(today))
        .filter(mantenimiento_calendario::Column::FechaProgramada.lte(next_week))
        .count(&db)
        .await?;

    // 5. Low Stock Items (Refactored to get details)
    let low_stock_data = activos_repuestos::Entity::find()
        .all(&db)
        .await?
        .into_iter()
        .filter(|p| {
            let actual = p.stock_actual.unwrap_or(0);
            let minimo = p.stock_minimo.unwrap_or(0);
            actual <= minimo
        })
        .collect::<Vec<_>>();
    
    let low_stock_items = low_stock_data.len() as u64;
    let low_stock_details: Vec<LowStockItemDto> = low_stock_data.into_iter()
        .map(|p| LowStockItemDto {
            id: p.id_repuesto,
            name: p.nombre_repuesto,
            current_stock: p.stock_actual.unwrap_or(0),
            min_stock: p.stock_minimo.unwrap_or(0),
        })
        .collect();

    // 6. Monthly Costs (Last 6 months)
    let six_months_ago = today - chrono::Duration::days(180);
    let history = mantenimiento_historial::Entity::find()
        .filter(mantenimiento_historial::Column::FechaEjecucion.gte(six_months_ago))
        .all(&db)
        .await?;

    let _distinct_months: Vec<String> = Vec::new();
    let month_names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    let mut costs_map: HashMap<String, f64> = HashMap::new();
    let mut chronology: Vec<String> = Vec::new();

    for i in (0..6).rev() {
        let d = today - chrono::Months::new(i);
        let key = format!("{} {}", month_names[d.month0() as usize], d.year());
        costs_map.insert(key.clone(), 0.0);
        chronology.push(key);
    }

    for h in history {
        if let Some(date) = h.fecha_ejecucion {
             let key = format!("{} {}", month_names[date.month0() as usize], date.year());
             if let Some(val) = costs_map.get_mut(&key) {
                  let cost = h.costo_mano_obra.map(|d| d.to_string().parse::<f64>().unwrap_or(0.0)).unwrap_or(0.0);
                  *val += cost;
             }
        }
    }

    let monthly_costs: Vec<MonthlyCostDto> = chronology.into_iter()
        .map(|month| MonthlyCostDto {
            month: month.clone(),
            amount: *costs_map.get(&month).unwrap_or(&0.0),
        })
        .collect();

    // NEW: Daily Costs (Current Month)
    let start_current_month = NaiveDate::from_ymd_opt(today.year(), today.month(), 1).unwrap();
    let end_current_month = if today.month() == 12 {
        NaiveDate::from_ymd_opt(today.year() + 1, 1, 1).unwrap()
    } else {
        NaiveDate::from_ymd_opt(today.year(), today.month() + 1, 1).unwrap()
    };

    let daily_history = mantenimiento_historial::Entity::find()
        .filter(mantenimiento_historial::Column::FechaEjecucion.gte(start_current_month))
        .filter(mantenimiento_historial::Column::FechaEjecucion.lt(end_current_month))
        .all(&db)
        .await?;

    let mut daily_map: HashMap<String, f64> = HashMap::new();
    let mut current_d = start_current_month;
    let mut daily_keys: Vec<String> = Vec::new();
    
    while current_d < end_current_month {
        let label = format!("{} {}", current_d.day(), month_names[current_d.month0() as usize]);
        daily_map.insert(label.clone(), 0.0);
        daily_keys.push(label);
        current_d = current_d.succ_opt().unwrap();
    }

    for h in daily_history {
        if let Some(date) = h.fecha_ejecucion {
            let label = format!("{} {}", date.day(), month_names[date.month0() as usize]);
            if let Some(val) = daily_map.get_mut(&label) {
                let cost = h.costo_mano_obra.map(|d| d.to_string().parse::<f64>().unwrap_or(0.0)).unwrap_or(0.0);
                 *val += cost;
            }
        }
    }

    let daily_costs: Vec<MonthlyCostDto> = daily_keys.into_iter().map(|k| MonthlyCostDto {
        month: k.clone(),
        amount: *daily_map.get(&k).unwrap_or(&0.0),
    }).collect();

    // 7. Upcoming Maintenance List (Top 5)
    let upcoming_tasks = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::Estado.ne("completado"))
        .filter(mantenimiento_calendario::Column::Estado.ne("cancelado"))
        .filter(mantenimiento_calendario::Column::FechaProgramada.gte(today))
        .order_by_asc(mantenimiento_calendario::Column::FechaProgramada)
        .limit(5)
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await?;

    let providers_list = proveedores::Entity::find().all(&db).await?;
    let prov_map: std::collections::HashMap<i32, String> = providers_list.into_iter()
        .map(|p| (p.id_proveedor, p.nombre_proveedor))
        .collect();

    let ots = orden_trabajo::Entity::find()
        .filter(orden_trabajo::Column::IdCalendario.is_not_null())
        .all(&db)
        .await?;
    let ot_map: std::collections::HashMap<i32, String> = ots.into_iter()
        .filter_map(|ot| ot.id_calendario.map(|cal_id| (cal_id, ot.codigo_ot.unwrap_or_default())))
        .collect();

    let upcoming_maintenance: Vec<UpcomingEventDto> = upcoming_tasks.into_iter().map(|(task, equipment)| {
        let equipo_name = equipment.map(|e| e.nombre_equipo).unwrap_or("N/A".to_string());
        let ot_code = ot_map.get(&task.id_mantenimiento_calendario).cloned();
        let prov_name = task.proveedor_id.and_then(|pid| prov_map.get(&pid).cloned());

        UpcomingEventDto {
            id: task.id_mantenimiento_calendario,
            title: equipo_name.clone(),
            date: task.fecha_programada.map(|d| d.to_string()).unwrap_or_default(),
            priority: task.prioridad.unwrap_or("Media".to_string()),
            type_name: "Mantenimiento".to_string(),
            asunto: task.asunto,
            equipo_nombre: equipo_name,
            codigo_mantenimiento: task.codigo_mantenimiento,
            tiene_ot: ot_code.is_some(),
            codigo_ot: ot_code,
            proveedor_nombre: prov_name,
        }
    }).collect();

    // 8. Calendar Events
    let start_date = today - chrono::Months::new(6);
    let end_date = today + chrono::Months::new(6);
    
    let calendar_tasks = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::FechaProgramada.gte(start_date))
        .filter(mantenimiento_calendario::Column::FechaProgramada.lte(end_date))
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await?;

    let calendar_events: Vec<UpcomingEventDto> = calendar_tasks.into_iter().map(|(task, equipment)| {
        let equipo_name = equipment.map(|e| e.nombre_equipo).unwrap_or("Mantenimiento".to_string());
        let ot_code = ot_map.get(&task.id_mantenimiento_calendario).cloned();
        let prov_name = task.proveedor_id.and_then(|pid| prov_map.get(&pid).cloned());

        UpcomingEventDto {
            id: task.id_mantenimiento_calendario,
            title: equipo_name.clone(),
            date: task.fecha_programada.map(|d| d.to_string()).unwrap_or_default(),
            priority: task.prioridad.unwrap_or("media".to_string()),
            type_name: "Preventivo".to_string(), 
            asunto: task.asunto,
            equipo_nombre: equipo_name,
            codigo_mantenimiento: task.codigo_mantenimiento,
            tiene_ot: ot_code.is_some(),
            codigo_ot: ot_code,
            proveedor_nombre: prov_name,
        }
    }).collect();

    Ok(Json(DashboardStats {
        total_assets,
        active_maintenance,
        pending_orders,
        upcoming_events_7d,
        monthly_costs,
        daily_costs,
        upcoming_maintenance,
        low_stock_items,
        low_stock_details,
        calendar_events,
    }))
}
