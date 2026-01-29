use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QuerySelect, RelationTrait, JoinType, QueryOrder};
use serde::{Deserialize, Serialize};
use crate::entities::{mantenimiento_calendario, mantenimiento_historial, mantenimiento_tipo, activos_equipos, tecnicos, orden_trabajo, mantenimiento_repuestos};

use chrono::NaiveDate;
use crate::utils::code_generator::generate_next_code;
use crate::controllers::inventory_transaction;
use sea_orm::TransactionTrait;

#[derive(Deserialize)]
pub struct CreateScheduleRequest {
    pub equipo_id: i32,
    pub tipo_mantenimiento_id: Option<i32>,
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
    pub tarea_tipo_id: Option<i32>,
    pub recurrente: Option<bool>,
    pub responsable_interno_email: Option<String>,
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
    pub orden_trabajo_id: Option<i32>,
    pub tiene_ot: bool,
    pub equipo_id: i32,
    pub tipo_mantenimiento_id: i32,
    pub tecnico_id: Option<i32>,
    pub proveedor_id: Option<i32>,
    pub costo_estimado: Option<f64>,
    pub dias_anticipacion: Option<i32>,
    pub tarea_tipo_id: Option<i32>,
    pub recurrente: bool,
    pub observaciones: Option<String>,
    pub responsable_id: Option<i32>,
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
        .order_by_asc(mantenimiento_calendario::Column::IdMantenimientoCalendario)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Fetch maintenance types separately to map names
    let m_types = mantenimiento_tipo::Entity::find()
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Fetch related OTs manually to avoid complex joins
    use std::collections::HashMap;
    let ots = orden_trabajo::Entity::find()
        .filter(orden_trabajo::Column::IdCalendario.is_not_null())
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let ot_map: HashMap<i32, i32> = ots.into_iter()
        .filter_map(|ot| ot.id_calendario.map(|cal_id| (cal_id, ot.id_ot)))
        .collect();

    let dtos: Vec<ScheduleDto> = schedules.into_iter().map(|(s, e)| {
        let tipo_nombre = m_types.iter()
            .find(|t| t.id_tipo_mantenimiento == s.tipo_mantenimiento_id)
            .map(|t| t.nombre_tipo.clone())
            .unwrap_or_else(|| "Preventivo".to_string());

        let ot_id = ot_map.get(&s.id_mantenimiento_calendario).cloned();

        ScheduleDto {
            id: s.id_mantenimiento_calendario,
            equipo: e.map(|v| v.nombre_equipo).unwrap_or("N/A".to_string()),
            tipo: tipo_nombre,
            fecha: s.fecha_programada.map(|d| d.to_string()),
            estado: s.estado.unwrap_or("programado".to_string()),
            responsable: s.responsable_interno_email.clone().or_else(|| Some("Asignado".to_string())).take().unwrap_or_default(),
            codigo: s.codigo_mantenimiento,
            prioridad: s.prioridad.unwrap_or("media".to_string()),
            orden_trabajo_id: ot_id,
            tiene_ot: ot_id.is_some(),
            equipo_id: s.equipo_id,
            tipo_mantenimiento_id: s.tipo_mantenimiento_id,
            tecnico_id: s.tecnico_id,
            proveedor_id: s.proveedor_id,
            costo_estimado: s.costo_estimado.map(|c| c.to_string().parse().unwrap_or(0.0)),
            dias_anticipacion: s.dias_anticipacion,
            tarea_tipo_id: s.tarea_tipo_id,
            recurrente: s.recurrente,
            observaciones: s.observaciones,
            responsable_id: s.responsable_id,
        }
    }).collect();



    Ok(Json(dtos))
}

pub async fn create_schedule(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateScheduleRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let codigo = generate_next_code(&db, "mantenimiento_calendario", "codigo_mantenimiento", "MNT-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let fecha = payload.fecha_programada.and_then(|f| NaiveDate::parse_from_str(&f, "%Y-%m-%d").ok());
    
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    let new_schedule = mantenimiento_calendario::ActiveModel {
        equipo_id: Set(payload.equipo_id),
        tipo_mantenimiento_id: Set(payload.tipo_mantenimiento_id.unwrap_or(1)), // Default to 1 if not sent
        frecuencia: Set(payload.frecuencia),
        fecha_programada: Set(fecha),
        responsable_id: Set(payload.responsable_id),
        observaciones: Set(payload.observaciones),
        estado: Set(Some("programado".to_string())),
        codigo_mantenimiento: Set(Some(codigo)),
        prioridad: Set(payload.prioridad),
        costo_estimado: Set(payload.costo_estimado.map(|c| Decimal::from_str(&c.to_string()).unwrap_or_default())),
        dias_anticipacion: Set(payload.dias_anticipacion),
        proveedor_id: Set(payload.proveedor_id),
        tecnico_id: Set(payload.tecnico_id),
        tarea_tipo_id: Set(payload.tarea_tipo_id),
        recurrente: Set(payload.recurrente.unwrap_or(false)),
        responsable_interno_email: Set(payload.responsable_interno_email),
        ..Default::default()
    };

    let s = new_schedule.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(s.id_mantenimiento_calendario))
}

#[derive(Deserialize)]
pub struct UpdateScheduleRequest {
    pub equipo_id: Option<i32>,
    pub tipo_mantenimiento_id: Option<i32>,
    pub frecuencia: Option<String>,
    pub fecha_programada: Option<String>,
    pub responsable_id: Option<i32>,
    pub observaciones: Option<String>,
    pub prioridad: Option<String>,
    pub costo_estimado: Option<f64>,
    pub dias_anticipacion: Option<i32>,
    pub proveedor_id: Option<i32>,
    pub tecnico_id: Option<i32>,
    pub tarea_tipo_id: Option<i32>,
    pub recurrente: Option<bool>,
    pub responsable_interno_email: Option<String>,
    pub estado: Option<String>,
}

pub async fn update_schedule(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateScheduleRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let schedule = mantenimiento_calendario::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Schedule not found".to_string()))?;

    let mut schedule_active: mantenimiento_calendario::ActiveModel = schedule.into();

    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    if let Some(v) = payload.equipo_id { schedule_active.equipo_id = Set(v); }
    if let Some(v) = payload.tipo_mantenimiento_id { schedule_active.tipo_mantenimiento_id = Set(v); }
    if let Some(v) = payload.frecuencia { schedule_active.frecuencia = Set(Some(v)); }
    if let Some(v) = payload.fecha_programada { 
        let fecha = NaiveDate::parse_from_str(&v, "%Y-%m-%d").ok();
        schedule_active.fecha_programada = Set(fecha);
    }
    if let Some(v) = payload.responsable_id { schedule_active.responsable_id = Set(Some(v)); }
    if let Some(v) = payload.observaciones { schedule_active.observaciones = Set(Some(v)); }
    if let Some(v) = payload.prioridad { schedule_active.prioridad = Set(Some(v)); }
    if let Some(v) = payload.costo_estimado { 
        schedule_active.costo_estimado = Set(Some(Decimal::from_str(&v.to_string()).unwrap_or_default())); 
    }
    if let Some(v) = payload.dias_anticipacion { schedule_active.dias_anticipacion = Set(Some(v)); }
    if let Some(v) = payload.proveedor_id { schedule_active.proveedor_id = Set(Some(v)); }
    if let Some(v) = payload.tecnico_id { schedule_active.tecnico_id = Set(Some(v)); }
    if let Some(v) = payload.tarea_tipo_id { schedule_active.tarea_tipo_id = Set(Some(v)); }
    if let Some(v) = payload.recurrente { schedule_active.recurrente = Set(v); }
    if let Some(v) = payload.responsable_interno_email { schedule_active.responsable_interno_email = Set(Some(v)); }
    if let Some(v) = payload.estado { schedule_active.estado = Set(Some(v)); }

    schedule_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Schedule updated successfully"))
}

pub async fn delete_schedule(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    mantenimiento_calendario::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Schedule deleted successfully"))
}

pub async fn execute_maintenance(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<ExecuteMaintenanceRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 1. Find schedule
    let schedule = mantenimiento_calendario::Entity::find_by_id(id)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Schedule not found".to_string()))?;

    let fecha_e = NaiveDate::parse_from_str(&payload.fecha_ejecucion, "%Y-%m-%d")
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid date format".to_string()))?;

    // 2. Create history record
    let history = mantenimiento_historial::ActiveModel {
        calendario_id: Set(Some(schedule.id_mantenimiento_calendario)),
        equipo_id: Set(schedule.equipo_id),
        tecnico_id: Set(Some(payload.tecnico_id)),
        fecha_ejecucion: Set(Some(fecha_e)),
        observaciones: Set(payload.observaciones),
        horas_trabajo: Set(Some(Decimal::from_str(&payload.horas_trabajo.to_string()).unwrap_or_default())),
        costo_mano_obra: Set(Some(Decimal::from_str(&payload.costo_mano_obra.to_string()).unwrap_or_default())),
        tipo_mantenimiento_id: Set(schedule.tipo_mantenimiento_id),
        tarea_tipo_id: Set(schedule.tarea_tipo_id),
        responsable_interno_email: Set(schedule.responsable_interno_email.clone()),
        ..Default::default()
    };

    history.insert(&txn).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Update schedule status
    let mut schedule_active: mantenimiento_calendario::ActiveModel = schedule.clone().into();
    schedule_active.estado = Set(Some("completado".to_string()));
    schedule_active.fecha_ultima_ejecucion = Set(Some(fecha_e));
    schedule_active.update(&txn).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 4. Consume parts (Inventory Integration)
    // Fetch parts planned for this maintenance
    let planned_parts = mantenimiento_repuestos::Entity::find()
        .filter(mantenimiento_repuestos::Column::MantenimientoId.eq(schedule.id_mantenimiento_calendario))
        .all(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for part_usage in planned_parts {
        let qty_used = part_usage.cantidad_estimada.to_string().parse::<i32>().unwrap_or(0);
        
        // Use custom transaction helper to consume reserved stock
        // Use user 1 as placeholder for now
        inventory_transaction::consume_reserved_stock(&txn, part_usage.repuesto_id, qty_used, schedule.id_mantenimiento_calendario, 1)
            .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        // 4.2 Record in historial_repuestos (Legacy compatibility)
        let usage_record = crate::entities::historial_repuestos::ActiveModel {
            repuesto_id: Set(part_usage.repuesto_id),
            equipo_id: Set(Some(schedule.equipo_id)),
            mantenimiento_id: Set(Some(schedule.id_mantenimiento_calendario)),
            cantidad_utilizada: Set(Some(qty_used)),
            fecha_uso: Set(Some(fecha_e)),
            tecnico_responsable: Set(Some(format!("Técnico ID: {}", payload.tecnico_id))),
            motivo: Set(Some("Ejecución de Mantenimiento".to_string())),
            ..Default::default()
        };
        usage_record.insert(&txn).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // 5. If recurrent, schedule next
    if schedule.recurrente {
        let next_date = match schedule.frecuencia.as_deref() {
            Some("Mensual") => Some(fecha_e + chrono::Months::new(1)),
            Some("Trimestral") => Some(fecha_e + chrono::Months::new(3)),
            Some("Semestral") => Some(fecha_e + chrono::Months::new(6)),
            Some("Anual") => Some(fecha_e + chrono::Months::new(12)),
            _ => None,
        };

        if let Some(next) = next_date {
            let next_schedule = mantenimiento_calendario::ActiveModel {
                equipo_id: Set(schedule.equipo_id),
                tipo_mantenimiento_id: Set(schedule.tipo_mantenimiento_id),
                frecuencia: Set(schedule.frecuencia.clone()),
                fecha_programada: Set(Some(next)),
                responsable_id: Set(schedule.responsable_id),
                observaciones: Set(schedule.observaciones.clone()),
                estado: Set(Some("programado".to_string())),
                codigo_mantenimiento: Set(Some(generate_next_code(&txn, "mantenimiento_calendario", "codigo_mantenimiento", "MNT-").await.unwrap_or_default())),
                prioridad: Set(schedule.prioridad.clone()),
                costo_estimado: Set(schedule.costo_estimado),
                dias_anticipacion: Set(schedule.dias_anticipacion),
                proveedor_id: Set(schedule.proveedor_id),
                tecnico_id: Set(schedule.tecnico_id),
                tarea_tipo_id: Set(schedule.tarea_tipo_id),
                recurrente: Set(true),
                responsable_interno_email: Set(schedule.responsable_interno_email.clone()),
                ..Default::default()
            };
            next_schedule.insert(&txn).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Maintenance executed and recorded".to_string()))
}

pub async fn get_maintenance_types(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let types = mantenimiento_tipo::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(types))
}

#[derive(Serialize)]
pub struct MaintenancePartDto {
    pub id: i32, // ID de la relación
    pub repuesto_id: i32,
    pub nombre: String,
    pub codigo: String,
    pub cantidad_estimada: f64,
    pub stock_actual: i32,
    pub costo_estimado: f64,
}

#[derive(Deserialize)]
pub struct AddPartRequest {
    pub repuesto_id: i32,
    pub cantidad: f64,
}

pub async fn get_maintenance_parts(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let parts = mantenimiento_repuestos::Entity::find()
        .filter(mantenimiento_repuestos::Column::MantenimientoId.eq(id))
        .find_also_related(crate::entities::activos_repuestos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<MaintenancePartDto> = parts.into_iter().map(|(mr, r)| {
        let repuesto = r.unwrap();
        use sea_orm::prelude::Decimal;
        
        // Helper to convert Decimal to f64
        let to_f64 = |d: Decimal| d.to_string().parse::<f64>().unwrap_or_default();

        MaintenancePartDto {
            id: mr.id,
            repuesto_id: mr.repuesto_id,
            nombre: repuesto.nombre_repuesto,
            codigo: repuesto.codigo_repuesto,
            cantidad_estimada: to_f64(mr.cantidad_estimada),
            stock_actual: repuesto.stock_actual.unwrap_or(0),
            costo_estimado: to_f64(mr.costo_estimado),
        }
    }).collect();

    Ok(Json(dtos))
}

pub async fn add_maintenance_part(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<AddPartRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Check if relation already exists
    let existing = mantenimiento_repuestos::Entity::find()
        .filter(mantenimiento_repuestos::Column::MantenimientoId.eq(id))
        .filter(mantenimiento_repuestos::Column::RepuestoId.eq(payload.repuesto_id))
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let cantidad_decimal = Decimal::from_str(&payload.cantidad.to_string()).unwrap_or_default();
    let cantidad_int = payload.cantidad as i32; // Assuming integer quantity for stock logic roughly

    if let Some(record) = existing {
        let old_qty_decimal = record.cantidad_estimada;
        let old_qty_int = old_qty_decimal.to_string().parse::<f64>().unwrap_or_default() as i32;
        
        let diff = cantidad_int - old_qty_int;

        let mut active: mantenimiento_repuestos::ActiveModel = record.into();
        active.cantidad_estimada = Set(cantidad_decimal);
        active.update(&txn).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        if diff > 0 {
             inventory_transaction::reserve_stock(&txn, payload.repuesto_id, diff, id, 1) // User 1 as placeholder system/admin
                .await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
        } else if diff < 0 {
             inventory_transaction::release_reservation(&txn, payload.repuesto_id, -diff, id, 1)
                .await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
        }

    } else {
        // Fetch part to get current cost
        let part = crate::entities::activos_repuestos::Entity::find_by_id(payload.repuesto_id)
            .one(&txn)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, "Repuesto no encontrado".to_string()))?;

        let cost = part.costo_unitario.unwrap_or_default();

        let new_record = mantenimiento_repuestos::ActiveModel {
            mantenimiento_id: Set(id),
            repuesto_id: Set(payload.repuesto_id),
            cantidad_estimada: Set(cantidad_decimal),
            costo_estimado: Set(cost),
            ..Default::default()
        };
        new_record.insert(&txn).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        inventory_transaction::reserve_stock(&txn, payload.repuesto_id, cantidad_int, id, 1)
            .await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Repuesto agregado y reservado".to_string()))
}

pub async fn remove_maintenance_part(
    State(db): State<DatabaseConnection>,
    Path(id_relation): Path<i32>, // This is the relationship ID (mantenimiento_repuestos.id)
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let record = mantenimiento_repuestos::Entity::find_by_id(id_relation)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Record not found".to_string()))?;

    let qty = record.cantidad_estimada.to_string().parse::<f64>().unwrap_or_default() as i32;
    let repuesto_id = record.repuesto_id;
    let mantenimiento_id = record.mantenimiento_id;

    mantenimiento_repuestos::Entity::delete_by_id(id_relation)
        .exec(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    inventory_transaction::release_reservation(&txn, repuesto_id, qty, mantenimiento_id, 1)
        .await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Repuesto removido y reserva liberada".to_string()))
}
