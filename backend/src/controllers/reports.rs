use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{Utc, Datelike, NaiveDate, NaiveTime};
use crate::entities::{prelude::*, *};


#[derive(Serialize)]
pub struct InventoryStatusDto {
    pub total_items: i64,
    pub total_value: f64,
    pub low_stock_count: i64,
    pub by_category: Vec<CategoryStatDto>,
}

#[derive(Serialize)]
pub struct CategoryStatDto {
    pub category: String,
    pub count: i64,
    pub value: f64,
}

#[derive(Deserialize)]
pub struct InventoryFilter {
    pub category: Option<String>,
}

pub async fn get_inventory_status(
    State(db): State<DatabaseConnection>,
    Query(params): Query<InventoryFilter>,
) -> Result<Json<InventoryStatusDto>, (StatusCode, String)> {
    let mut query = activos_repuestos::Entity::find();

    if let Some(cat) = params.category {
        if !cat.is_empty() {
            query = query.filter(activos_repuestos::Column::TipoRepuesto.eq(cat));
        }
    }

    let all_parts = query.all(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let mut total_items = 0;
    let mut total_value = 0.0;
    let mut low_stock_count = 0;
    let mut category_map: HashMap<String, (i64, f64)> = HashMap::new();

    for part in all_parts {
        let quantity = part.stock_actual.unwrap_or(0);
        let cost = part.costo_unitario.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
        let value = (quantity as f64) * cost;
        
        total_items += quantity as i64;
        total_value += value;
        
        if quantity <= part.stock_minimo.unwrap_or(0) {
            low_stock_count += 1;
        }

        let cat_name = part.tipo_repuesto.clone().unwrap_or("Sin Categoría".to_string());
        let entry = category_map.entry(cat_name).or_insert((0, 0.0));
        entry.0 += quantity as i64;
        entry.1 += value;
    }

    let by_category = category_map.into_iter().map(|(k, v)| CategoryStatDto {
        category: k,
        count: v.0,
        value: v.1,
    }).collect();

    Ok(Json(InventoryStatusDto {
        total_items,
        total_value,
        low_stock_count,
        by_category,
    }))
}

#[derive(Serialize)]
pub struct MaintenanceRoiDto {
    pub asset_name: String,
    pub purchase_value: f64,
    pub maintenance_cost: f64,
    pub cost_ratio_percentage: f64,
}

pub async fn get_maintenance_roi(
    State(db): State<DatabaseConnection>,
) -> Result<Json<Vec<MaintenanceRoiDto>>, (StatusCode, String)> {
    let assets = activos_equipos::Entity::find().all(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut results = Vec::new();

    for asset in assets {
        // Use equipo_id based on typical SeaORM convention if id_activo failed
        let maintenance_cost = mantenimiento_historial::Entity::find()
            .filter(mantenimiento_historial::Column::EquipoId.eq(asset.id_equipo))
            .all(&db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .iter()
            .map(|h| h.costo_total.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0))
            .sum::<f64>();

        let purchase_value = asset.valor_compra.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
        
        let ratio = if purchase_value > 0.0 {
            (maintenance_cost / purchase_value) * 100.0
        } else {
            0.0
        };

        if maintenance_cost > 0.0 {
             results.push(MaintenanceRoiDto {
                asset_name: asset.nombre_equipo,
                purchase_value,
                maintenance_cost,
                cost_ratio_percentage: ratio,
            });
        }
    }

    results.sort_by(|a, b| b.cost_ratio_percentage.partial_cmp(&a.cost_ratio_percentage).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(Json(results.into_iter().take(20).collect()))
}

#[derive(Serialize)]
pub struct AssetDepreciationDto {
    pub total_purchase_value: f64,
    pub total_current_value: f64,
    pub total_depreciation: f64,
    pub assets_analyzed: i64,
}

pub async fn get_asset_depreciation(
    State(db): State<DatabaseConnection>,
) -> Result<Json<AssetDepreciationDto>, (StatusCode, String)> {
    let assets = activos_equipos::Entity::find().all(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut total_purchase = 0.0;
    let mut total_current = 0.0;
    let count = assets.len() as i64;
    let now = Utc::now().naive_utc().date();

    for asset in assets {
        let purchase_val = asset.valor_compra.unwrap_or_default().to_string().parse::<f64>().unwrap_or(0.0);
        let life_months = asset.vida_util_meses.unwrap_or(60) as f64; // Default 5 years (60 months)
        let purchase_date = asset.fecha_adquisicion;

        let current_val = if let Some(p_date) = purchase_date {
            let age_days = (now - p_date).num_days() as f64;
            let age_months = age_days / 30.44; 

            // Depreciacion Lineal
            let dep_amount = if life_months > 0.0 {
                (purchase_val / life_months) * age_months
            } else {
                0.0
            };

            let mut val = purchase_val - dep_amount;
            if val < 0.0 { val = 0.0; }
            val
        } else {
            purchase_val
        };

        total_purchase += purchase_val;
        total_current += current_val;
    }

    Ok(Json(AssetDepreciationDto {
        total_purchase_value: total_purchase,
        total_current_value: total_current,
        total_depreciation: total_purchase - total_current,
        assets_analyzed: count,
    }))
}

// Scheduled Reports CRUD

pub async fn get_scheduled_reports(
    State(db): State<DatabaseConnection>,
) -> Result<Json<Vec<reportes_programados::Model>>, (StatusCode, String)> {
    let reports = reportes_programados::Entity::find()
        .order_by_desc(reportes_programados::Column::CreatedAt)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(reports))
}

#[derive(Deserialize)]
pub struct CreateScheduledReportDto {
    pub nombre: String,
    pub tipo_reporte: String,
    pub frecuencia: String,
    pub filtros: Option<serde_json::Value>,
    pub destinatarios: Option<String>,
    pub fecha_inicio: NaiveDate,
    pub fecha_fin: Option<NaiveDate>,
    pub hora_ejecucion: NaiveTime,
}

pub async fn create_scheduled_report(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateScheduledReportDto>,
) -> Result<Json<reportes_programados::Model>, (StatusCode, String)> {
    let new_report = reportes_programados::ActiveModel {
        nombre: Set(payload.nombre),
        tipo_reporte: Set(payload.tipo_reporte),
        frecuencia: Set(payload.frecuencia),
        filtros: Set(payload.filtros),
        destinatarios: Set(payload.destinatarios),
        fecha_inicio: Set(payload.fecha_inicio),
        fecha_fin: Set(payload.fecha_fin),
        hora_ejecucion: Set(payload.hora_ejecucion),
        activo: Set(Some(true)),
        ..Default::default()
    };

    let saved = new_report.insert(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(saved))
}

pub async fn update_scheduled_report(
    Path(id): Path<i32>,
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateScheduledReportDto>,
) -> Result<Json<reportes_programados::Model>, (StatusCode, String)> {
    let report: Option<reportes_programados::Model> = reportes_programados::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let report = report.ok_or((StatusCode::NOT_FOUND, "Report not found".to_string()))?;
    let mut report: reportes_programados::ActiveModel = report.into();

    report.nombre = Set(payload.nombre);
    report.tipo_reporte = Set(payload.tipo_reporte);
    report.frecuencia = Set(payload.frecuencia);
    report.filtros = Set(payload.filtros);
    report.destinatarios = Set(payload.destinatarios);
    report.fecha_inicio = Set(payload.fecha_inicio);
    report.fecha_fin = Set(payload.fecha_fin);
    report.hora_ejecucion = Set(payload.hora_ejecucion);
    report.updated_at = Set(Some(Utc::now().into()));

    let updated = report.update(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(updated))
}

pub async fn delete_scheduled_report(
    Path(id): Path<i32>,
    State(db): State<DatabaseConnection>,
) -> Result<StatusCode, (StatusCode, String)> {
    reportes_programados::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(StatusCode::NO_CONTENT)
}
