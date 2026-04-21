use axum::{Json, extract::{State, Path}, response::IntoResponse, Extension};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QueryOrder, TransactionTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{mantenimiento_calendario, mantenimiento_historial, mantenimiento_tipo, activos_equipos, orden_trabajo, mantenimiento_repuestos, proveedores};
use chrono::NaiveDate;
use crate::utils::{code_generator::generate_next_code, error::AppError, audit};
use crate::utils::jwt::Claims;
use crate::controllers::inventory_transaction;

#[derive(Deserialize)]
pub struct CreateScheduleRequest {
    pub equipo_id: i32,
    pub tipo_mantenimiento_id: Option<i32>,
    pub frecuencia: Option<String>,
    pub fecha_programada: Option<String>,
    pub responsable_id: Option<i32>,
    pub observaciones: Option<String>,
    pub _codigo_mantenimiento: Option<String>,
    pub prioridad: Option<String>,
    pub costo_estimado: Option<f64>,
    pub dias_anticipacion: Option<i32>,
    pub proveedor_id: Option<i32>,
    pub tecnico_id: Option<i32>,
    pub tarea_tipo_id: Option<i32>,
    pub recurrente: Option<bool>,
    pub responsable_interno_email: Option<String>,
    pub crear_ot: Option<bool>,
    pub asunto: Option<String>,
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
    pub frecuencia: Option<String>,
    pub observaciones: Option<String>,
    pub responsable_id: Option<i32>,
    pub asunto: Option<String>,
    pub codigo_ot: Option<String>,
    pub proveedor_nombre: Option<String>,
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
) -> Result<impl IntoResponse, AppError> {
    let schedules = mantenimiento_calendario::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .order_by_asc(mantenimiento_calendario::Column::IdMantenimientoCalendario)
        .all(&db)
        .await?;

    let m_types = mantenimiento_tipo::Entity::find()
        .all(&db)
        .await?;

    use std::collections::HashMap;
    let ots = orden_trabajo::Entity::find()
        .filter(orden_trabajo::Column::IdCalendario.is_not_null())
        .all(&db)
        .await?;

    let providers_list = proveedores::Entity::find().all(&db).await?;
    let prov_map: HashMap<i32, String> = providers_list.into_iter()
        .map(|p| (p.id_proveedor, p.nombre_proveedor))
        .collect();

    let ot_map: HashMap<i32, (i32, String)> = ots.into_iter()
        .filter_map(|ot| ot.id_calendario.map(|cal_id| (cal_id, (ot.id_ot, ot.codigo_ot.unwrap_or_default()))))
        .collect();

    let dtos: Vec<ScheduleDto> = schedules.into_iter().map(|(s, e)| {
        let tipo_nombre = m_types.iter()
            .find(|t| t.id_tipo_mantenimiento == s.tipo_mantenimiento_id)
            .map(|t| t.nombre_tipo.clone())
            .unwrap_or_else(|| "Preventivo".to_string());

        let ot_info = ot_map.get(&s.id_mantenimiento_calendario);
        let ot_id = ot_info.map(|v| v.0);
        let ot_code = ot_info.map(|v| v.1.clone());
        let prov_name = s.proveedor_id.and_then(|pid| prov_map.get(&pid).cloned());

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
            frecuencia: s.frecuencia,
            observaciones: s.observaciones,
            responsable_id: s.responsable_id,
            asunto: s.asunto,
            codigo_ot: ot_code,
            proveedor_nombre: prov_name,
        }
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_schedule(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateScheduleRequest>,
) -> Result<impl IntoResponse, AppError> {
    let codigo = generate_next_code(&db, "mantenimiento_calendario", "codigo_mantenimiento", "MNT-").await?;

    let fecha = payload.fecha_programada.and_then(|f| NaiveDate::parse_from_str(&f, "%Y-%m-%d").ok());
    
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    let new_schedule = mantenimiento_calendario::ActiveModel {
        equipo_id: Set(payload.equipo_id),
        tipo_mantenimiento_id: Set(payload.tipo_mantenimiento_id.unwrap_or(1)),
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
        asunto: Set(payload.asunto),
        ..Default::default()
    };

    let s = new_schedule.insert(&db).await?;

    if payload.crear_ot.unwrap_or(false) {
        // Encontrar el modelo insertado para tener sus campos
        let mnt = mantenimiento_calendario::Entity::find_by_id(s.id_mantenimiento_calendario)
            .one(&db)
            .await?
            .ok_or_else(|| AppError::Internal("Error al recuperar el mantenimiento recién creado".to_string()))?;

        // Llamar a una utilidad para crear la OT (similar a la del cron)
        if let Err(e) = create_ot_from_maintenance_manual(&db, &mnt).await {
             eprintln!("Error al crear OT manual desde mantenimiento: {:?}", e);
        }
    }

    Ok(Json(s.id_mantenimiento_calendario))
}

async fn create_ot_from_maintenance_manual(db: &DatabaseConnection, mnt: &mantenimiento_calendario::Model) -> Result<(), AppError> {
    let next_code = crate::utils::code_generator::generate_next_code(db, "orden_trabajo", "codigo_ot", "OT-").await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let new_ot = orden_trabajo::ActiveModel {
        id_calendario: Set(Some(mnt.id_mantenimiento_calendario)),
        id_activo: Set(Some(mnt.equipo_id)),
        id_tipo_mantenimiento: Set(Some(mnt.tipo_mantenimiento_id)),
        id_tecnico: Set(mnt.tecnico_id),
        id_proveedor: Set(mnt.proveedor_id),
        prioridad: Set(mnt.prioridad.clone()),
        observaciones: Set(mnt.observaciones.clone()),
        codigo_ot: Set(Some(next_code)),
        estado: Set(Some("abierta".to_string())),
        costo_estimado: Set(mnt.costo_estimado),
        tipo_ot: Set("Preventiva".to_string()),
        asunto: Set(mnt.asunto.clone()),
        ..Default::default()
    };

    new_ot.insert(db).await.map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(())
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
    pub asunto: Option<String>,
}

pub async fn update_schedule(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateScheduleRequest>,
) -> Result<impl IntoResponse, AppError> {
    let schedule = mantenimiento_calendario::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Schedule not found".to_string()))?;

    let mut schedule_active: mantenimiento_calendario::ActiveModel = schedule.into();

    
    

    if let Some(v) = payload.equipo_id { schedule_active.equipo_id = Set(v); }
    if let Some(v) = payload.tipo_mantenimiento_id { schedule_active.tipo_mantenimiento_id = Set(v); }
    if let Some(v) = payload.frecuencia { schedule_active.frecuencia = Set(Some(v)); }
    if let Some(v) = payload.fecha_programada {
        if let Ok(date) = NaiveDate::parse_from_str(&v, "%Y-%m-%d") {
            schedule_active.fecha_programada = Set(Some(date));
        }
    }
    if let Some(v) = payload.responsable_id { schedule_active.responsable_id = Set(Some(v)); }
    if let Some(v) = payload.observaciones { schedule_active.observaciones = Set(Some(v)); }
    if let Some(v) = payload.prioridad { schedule_active.prioridad = Set(Some(v)); }
    if let Some(v) = payload.costo_estimado { schedule_active.costo_estimado = Set(Some(sea_orm::prelude::Decimal::from_f64_retain(v).unwrap_or_default())); }
    if let Some(v) = payload.dias_anticipacion { schedule_active.dias_anticipacion = Set(Some(v)); }
    if let Some(v) = payload.proveedor_id { schedule_active.proveedor_id = Set(Some(v)); }
    if let Some(v) = payload.tecnico_id { schedule_active.tecnico_id = Set(Some(v)); }
    if let Some(v) = payload.tarea_tipo_id { schedule_active.tarea_tipo_id = Set(Some(v)); }
    if let Some(v) = payload.recurrente { schedule_active.recurrente = Set(v); }
    if let Some(v) = payload.responsable_interno_email { schedule_active.responsable_interno_email = Set(Some(v)); }
    if let Some(v) = payload.estado { schedule_active.estado = Set(Some(v)); }
    if let Some(v) = payload.asunto { schedule_active.asunto = Set(Some(v)); }

    schedule_active.update(&db).await?;

    Ok(Json("Schedule updated successfully".to_string()))
}

pub async fn delete_schedule(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let txn = db.begin().await?;

    // 1. Release reservations and delete parts
    let parts = mantenimiento_repuestos::Entity::find()
        .filter(mantenimiento_repuestos::Column::MantenimientoId.eq(id))
        .all(&txn)
        .await?;

    for part in parts {
        let qty = part.cantidad_estimada.to_string().parse::<f64>().unwrap_or_default() as i32;
        // Release reservation (assuming type 1 for maintenance reservation, though strictly we might just want to delete)
        // If the part was just 'estimated' and not 'consumed', we should release.
        // If it was consumed, it's already out of stock. But for a future schedule, it's likely just reserved/estimated.
        // Checks strictness: if it's a future task, it shouldn't have consumed parts yet.
        let _ = inventory_transaction::release_reservation(&txn, part.repuesto_id, qty, part.id, 1).await;
        
        mantenimiento_repuestos::Entity::delete_by_id(part.id)
            .exec(&txn)
            .await?;
    }

    // 2. Delete history (if any exists for this schedule ID - rare for future tasks but possible)
    mantenimiento_historial::Entity::delete_many()
        .filter(mantenimiento_historial::Column::CalendarioId.eq(Some(id)))
        .exec(&txn)
        .await?;

    // 3. Delete Schedule
    mantenimiento_calendario::Entity::delete_by_id(id)
        .exec(&txn)
        .await?;

    txn.commit().await?;

    Ok(Json("Schedule deleted successfully"))
}

pub async fn execute_maintenance(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<ExecuteMaintenanceRequest>,
) -> Result<impl IntoResponse, AppError> {
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    let txn = db.begin().await?;

    let schedule = mantenimiento_calendario::Entity::find_by_id(id)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::NotFound("Schedule not found".to_string()))?;

    let fecha_e = NaiveDate::parse_from_str(&payload.fecha_ejecucion, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid date format".to_string()))?;

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

    history.insert(&txn).await?;

    let mut schedule_active: mantenimiento_calendario::ActiveModel = schedule.clone().into();
    schedule_active.estado = Set(Some("completado".to_string()));
    schedule_active.fecha_ultima_ejecucion = Set(Some(fecha_e));
    schedule_active.update(&txn).await?;

    let planned_parts = mantenimiento_repuestos::Entity::find()
        .filter(mantenimiento_repuestos::Column::MantenimientoId.eq(schedule.id_mantenimiento_calendario))
        .all(&txn)
        .await?;

    for part_usage in planned_parts {
        let qty_used = part_usage.cantidad_estimada.to_string().parse::<f64>().unwrap_or_default() as i32;
        
        inventory_transaction::consume_reserved_stock(&txn, part_usage.repuesto_id, qty_used, schedule.id_mantenimiento_calendario, 1)
            .await?;

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
        usage_record.insert(&txn).await?;
    }

    let message = if schedule.recurrente {
        let base_recurrence = schedule.fecha_programada.unwrap_or(fecha_e);
        
        let next_date = match schedule.frecuencia.as_deref() {
            Some("Mensual") => Some(base_recurrence + chrono::Months::new(1)),
            Some("Trimestral") => Some(base_recurrence + chrono::Months::new(3)),
            Some("Semestral") => Some(base_recurrence + chrono::Months::new(6)),
            Some("Anual") => Some(base_recurrence + chrono::Months::new(12)),
            Some("Diaria") => Some(base_recurrence + chrono::Duration::days(1)),
            Some("Semanal") => Some(base_recurrence + chrono::Duration::weeks(1)),
            _ => None,
        };

        if let Some(base) = next_date {
            // Apply Panama Rules: Check holidays and weekends
            // Default policy: Postergar (Move to next working day)
            let next = crate::utils::scheduler::calculate_next_valid_date(
                &txn, 
                base, 
                crate::utils::scheduler::AjustePolitica::Postergar
            ).await.unwrap_or(base);

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
                asunto: Set(schedule.asunto.clone()),
                ..Default::default()
            };
            next_schedule.insert(&txn).await?;
            format!("Mantenimiento completado. Próximo: {}", next)
        } else {
            "Mantenimiento completado. No se generó siguiente fecha (Frecuencia inválida).".to_string()
        }
    } else {
        "Mantenimiento completado (No recurrente).".to_string()
    };
    audit::log_action(
        &txn,
        claims.user_id,
        "EXECUTE_MAINTENANCE",
        "mantenimiento_calendario",
        Some(id),
        Some(format!("Mantenimiento ejecutado para equipo ID: {}", schedule.equipo_id)),
        None,
    ).await;
    
    txn.commit().await?;

    Ok(Json(message))
}

pub async fn get_maintenance_types(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let types = mantenimiento_tipo::Entity::find().all(&db).await?;
    Ok(Json(types))
}

#[derive(Serialize)]
pub struct MaintenancePartDto {
    pub id: i32,
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
) -> Result<impl IntoResponse, AppError> {
    let parts = mantenimiento_repuestos::Entity::find()
        .filter(mantenimiento_repuestos::Column::MantenimientoId.eq(id))
        .find_also_related(crate::entities::activos_repuestos::Entity)
        .all(&db)
        .await?;

    let dtos: Vec<MaintenancePartDto> = parts.into_iter().map(|(mr, r)| {
        let repuesto = r.unwrap();
        use sea_orm::prelude::Decimal;
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
) -> Result<impl IntoResponse, AppError> {
    use sea_orm::prelude::Decimal;
    use std::str::FromStr;

    let txn = db.begin().await?;

    let existing = mantenimiento_repuestos::Entity::find()
        .filter(mantenimiento_repuestos::Column::MantenimientoId.eq(id))
        .filter(mantenimiento_repuestos::Column::RepuestoId.eq(payload.repuesto_id))
        .one(&txn)
        .await?;

    let cantidad_decimal = Decimal::from_str(&payload.cantidad.to_string()).unwrap_or_default();
    let cantidad_int = payload.cantidad as i32;

    if let Some(record) = existing {
        let old_qty_decimal = record.cantidad_estimada;
        let old_qty_int = old_qty_decimal.to_string().parse::<f64>().unwrap_or_default() as i32;
        
        let diff = cantidad_int - old_qty_int;

        let mut active: mantenimiento_repuestos::ActiveModel = record.into();
        active.cantidad_estimada = Set(cantidad_decimal);
        active.update(&txn).await?;
        
        if diff > 0 {
             inventory_transaction::reserve_stock(&txn, payload.repuesto_id, diff, id, 1)
                .await.map_err(|e| AppError::BadRequest(e.to_string()))?;
        } else if diff < 0 {
             inventory_transaction::release_reservation(&txn, payload.repuesto_id, -diff, id, 1)
                .await.map_err(|e| AppError::BadRequest(e.to_string()))?;
        }

    } else {
        let part = crate::entities::activos_repuestos::Entity::find_by_id(payload.repuesto_id)
            .one(&txn)
            .await?
            .ok_or_else(|| AppError::NotFound("Repuesto no encontrado".to_string()))?;

        let cost = part.costo_unitario.unwrap_or_default();

        let new_record = mantenimiento_repuestos::ActiveModel {
            mantenimiento_id: Set(id),
            repuesto_id: Set(payload.repuesto_id),
            cantidad_estimada: Set(cantidad_decimal),
            costo_estimado: Set(cost),
            ..Default::default()
        };
        new_record.insert(&txn).await?;
        
        inventory_transaction::reserve_stock(&txn, payload.repuesto_id, cantidad_int, id, 1)
            .await.map_err(|e| AppError::BadRequest(e.to_string()))?;
    }

    txn.commit().await?;

    Ok(Json("Repuesto agregado y reservado".to_string()))
}

pub async fn remove_maintenance_part(
    State(db): State<DatabaseConnection>,
    Path(id_relation): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let txn = db.begin().await?;

    let record = mantenimiento_repuestos::Entity::find_by_id(id_relation)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::NotFound("Record not found".to_string()))?;

    let qty = record.cantidad_estimada.to_string().parse::<f64>().unwrap_or_default() as i32;
    let repuesto_id = record.repuesto_id;
    let mantenimiento_id = record.mantenimiento_id;

    mantenimiento_repuestos::Entity::delete_by_id(id_relation)
        .exec(&txn)
        .await?;

    inventory_transaction::release_reservation(&txn, repuesto_id, qty, mantenimiento_id, 1)
        .await.map_err(|e| AppError::BadRequest(e.to_string()))?;

    txn.commit().await?;

    Ok(Json("Repuesto removido y reserva liberada".to_string()))
}

pub async fn get_public_schedules(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let schedules = mantenimiento_calendario::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .filter(mantenimiento_calendario::Column::Estado.ne("cancelado"))
        .order_by_asc(mantenimiento_calendario::Column::FechaProgramada)
        .all(&db)
        .await?;

    let m_types = mantenimiento_tipo::Entity::find()
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
    let ot_map: std::collections::HashMap<i32, (i32, String)> = ots.into_iter()
        .filter_map(|ot| ot.id_calendario.map(|cal_id| (cal_id, (ot.id_ot, ot.codigo_ot.unwrap_or_default()))))
        .collect();

    let dtos: Vec<ScheduleDto> = schedules.into_iter().map(|(s, e)| {
        let tipo_nombre = m_types.iter()
            .find(|t| t.id_tipo_mantenimiento == s.tipo_mantenimiento_id)
            .map(|t| t.nombre_tipo.clone())
            .unwrap_or_else(|| "Preventivo".to_string());

        let ot_info = ot_map.get(&s.id_mantenimiento_calendario);
        let ot_id = ot_info.map(|v| v.0);
        let ot_code = ot_info.map(|v| v.1.clone());
        let prov_name = s.proveedor_id.and_then(|pid| prov_map.get(&pid).cloned());

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
            frecuencia: s.frecuencia,
            observaciones: s.observaciones,
            responsable_id: s.responsable_id,
            asunto: s.asunto,
            codigo_ot: ot_code,
            proveedor_nombre: prov_name,
        }
    }).collect();

    Ok(Json(dtos))
}

pub async fn get_pending_schedules(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let schedules = mantenimiento_calendario::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .filter(mantenimiento_calendario::Column::OrdenTrabajoId.is_null())
        .filter(mantenimiento_calendario::Column::Estado.eq("programado"))
        .order_by_asc(mantenimiento_calendario::Column::FechaProgramada)
        .all(&db)
        .await?;

    let m_types = mantenimiento_tipo::Entity::find()
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
    let ot_map: std::collections::HashMap<i32, (i32, String)> = ots.into_iter()
        .filter_map(|ot| ot.id_calendario.map(|cal_id| (cal_id, (ot.id_ot, ot.codigo_ot.unwrap_or_default()))))
        .collect();

    let dtos: Vec<ScheduleDto> = schedules.into_iter().map(|(s, e)| {
        let tipo_nombre = m_types.iter()
            .find(|t| t.id_tipo_mantenimiento == s.tipo_mantenimiento_id)
            .map(|t| t.nombre_tipo.clone())
            .unwrap_or_else(|| "Preventivo".to_string());

        let ot_info = ot_map.get(&s.id_mantenimiento_calendario);
        let ot_id = ot_info.map(|v| v.0);
        let ot_code = ot_info.map(|v| v.1.clone());
        let prov_name = s.proveedor_id.and_then(|pid| prov_map.get(&pid).cloned());

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
            frecuencia: s.frecuencia,
            observaciones: s.observaciones,
            responsable_id: s.responsable_id,
            asunto: s.asunto,
            codigo_ot: ot_code,
            proveedor_nombre: prov_name,
        }
    }).collect();

    Ok(Json(dtos))
}
