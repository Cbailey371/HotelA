use tokio_cron_scheduler::{Job, JobScheduler};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait};
use crate::entities::{mantenimiento_calendario, orden_trabajo};
use chrono::{Local, Duration};

pub async fn init_scheduler(db: DatabaseConnection) -> Result<(), Box<dyn std::error::Error>> {
    let sched = JobScheduler::new().await?;

    // Job que corre cada hora para mayor precisión (aunque la lógica es diaria)
    // Formato: sec min hour day month day_of_week
    let db_clone = db.clone();
    let job = Job::new_async("0 0 * * * *", move |_uuid, _l| {
        let db = db_clone.clone();
        Box::pin(async move {
            if let Err(e) = process_pending_maintenance_ots(&db).await {
                eprintln!("Error en el job de cron: {:?}", e);
            }
        })
    })?;

    sched.add(job).await?;
    sched.start().await?;

    Ok(())
}

async fn process_pending_maintenance_ots(db: &DatabaseConnection) -> Result<(), Box<dyn std::error::Error>> {
    let today = Local::now().date_naive();
    
    // Buscar mantenimientos programados que:
    // 1. Estén en estado 'programado'
    // 2. Tengan dias_anticipacion configurado
    // 3. (Fecha Programada - Dias Anticipacion) <= Hoy
    // 4. No tengan ya una OT vinculada (evitar duplicados)
    
    let pending_maintenances = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::Estado.eq("programado"))
        .filter(mantenimiento_calendario::Column::DiasAnticipacion.is_not_null())
        .all(db)
        .await?;

    for mnt in pending_maintenances {
        let dias = mnt.dias_anticipacion.unwrap_or(0);
        if let Some(fecha_prog) = mnt.fecha_programada {
            let trigger_date = fecha_prog - Duration::days(dias as i64);
            
            if today >= trigger_date {
                // Verificar si ya existe una OT para este calendario
                let existing_ot = orden_trabajo::Entity::find()
                    .filter(orden_trabajo::Column::IdCalendario.eq(mnt.id_mantenimiento_calendario))
                    .one(db)
                    .await?;

                if existing_ot.is_none() {
                    create_ot_from_maintenance(db, &mnt).await?;
                }
            }
        }
    }

    Ok(())
}

async fn create_ot_from_maintenance(db: &DatabaseConnection, mnt: &mantenimiento_calendario::Model) -> Result<(), Box<dyn std::error::Error>> {
    let next_code = crate::utils::code_generator::generate_next_code(db, "orden_trabajo", "codigo_ot", "OT-").await?;

    let new_ot = orden_trabajo::ActiveModel {
        id_calendario: Set(Some(mnt.id_mantenimiento_calendario)),
        id_activo: Set(Some(mnt.equipo_id)),
        id_tipo_mantenimiento: Set(Some(mnt.tipo_mantenimiento_id)),
        id_tecnico: Set(mnt.tecnico_id),
        id_proveedor: Set(mnt.proveedor_id),
        prioridad: Set(mnt.prioridad.clone()),
        observaciones: Set(mnt.observaciones.clone().map(|obs| format!("[AUTO-GENERADA] {}", obs)).or(Some("[AUTO-GENERADA]".to_string()))),
        codigo_ot: Set(Some(next_code)),
        estado: Set(Some("abierta".to_string())),
        costo_estimado: Set(mnt.costo_estimado),
        tipo_ot: Set("Preventiva".to_string()),
        ..Default::default()
    };

    new_ot.insert(db).await?;
    
    // Opcional: Notificar al técnico/proveedor si tiene email
    // ...
    
    println!("OT generada automáticamente para mantenimiento: {}", mnt.codigo_mantenimiento.clone().unwrap_or_default());
    
    Ok(())
}
