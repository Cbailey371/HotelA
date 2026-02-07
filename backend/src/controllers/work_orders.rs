use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QuerySelect, RelationTrait, JoinType};
use serde::{Deserialize, Serialize};
use crate::entities::{orden_trabajo, activos_equipos, tecnicos, proveedores, mantenimiento_tipo, mantenimiento_calendario};
use std::str::FromStr;

#[derive(Deserialize)]
pub struct CreateWorkOrderRequest {
    pub id_calendario: Option<i32>,
    pub id_calendarios: Option<Vec<i32>>, // New field for multiple
    pub id_activo: i32,
    pub id_tipo_mantenimiento: i32,
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub costo_estimado: Option<f64>,
    pub terminos_pago: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateWorkOrderRequest {
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub id_tipo_mantenimiento: Option<i32>,
    pub id_calendario: Option<Option<i32>>,
    pub costo_estimado: Option<f64>,
    pub terminos_pago: Option<String>,
}

#[derive(Serialize)]
pub struct WorkOrderDto {
    pub id_ot: i32,
    pub id_calendario: Option<i32>,
    pub id_activo: i32,
    pub id_tipo_mantenimiento: Option<i32>,
    pub nombre_tipo_mantenimiento: Option<String>,
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub estado: Option<String>,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub codigo_ot: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub activo: Option<activos_equipos::Model>,
    pub nombre_tecnico: Option<String>,
    pub nombre_proveedor: Option<String>,
    pub codigo_mantenimiento: Option<String>,
    pub costo_estimado: Option<f64>,
    pub terminos_pago: Option<String>,
    pub mantenimiento_costo_estimado: Option<f64>,
    pub mantenimientos: Vec<MaintenanceSimpleDto>, // New field
}

#[derive(Serialize)]
pub struct MaintenanceSimpleDto {
    pub id: i32,
    pub equipo: String,
    pub tipo: String,
    pub fecha: Option<String>,
}

pub async fn create_work_order(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateWorkOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Generate sequential code
    let next_code = crate::utils::code_generator::generate_next_code(&db, "orden_trabajo", "codigo_ot", "OT-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_ot = orden_trabajo::ActiveModel {
        id_calendario: Set(payload.id_calendario),
        id_activo: Set(payload.id_activo),
        id_tipo_mantenimiento: Set(Some(payload.id_tipo_mantenimiento)),
        id_tecnico: Set(payload.id_tecnico),
        id_proveedor: Set(payload.id_proveedor),
        prioridad: Set(payload.prioridad),
        observaciones: Set(payload.observaciones),
        codigo_ot: Set(Some(next_code)),
        estado: Set(Some("abierta".to_string())),
        costo_estimado: Set(payload.costo_estimado.map(|c| sea_orm::prelude::Decimal::from_str(&c.to_string()).unwrap_or_default())),
        terminos_pago: Set(payload.terminos_pago),
        ..Default::default()
    };

    let ot = new_ot.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Link multiple maintenance schedules if provided
    if let Some(ids) = payload.id_calendarios {
        if !ids.is_empty() {
             mantenimiento_calendario::Entity::update_many()
                .col_expr(mantenimiento_calendario::Column::OrdenTrabajoId, sea_orm::sea_query::Expr::value(ot.id_ot))
                .filter(mantenimiento_calendario::Column::IdMantenimientoCalendario.is_in(ids))
                .exec(&db)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    } else if let Some(single_id) = payload.id_calendario {
        // Fallback for legacy single ID
         mantenimiento_calendario::Entity::update_many()
            .col_expr(mantenimiento_calendario::Column::OrdenTrabajoId, sea_orm::sea_query::Expr::value(ot.id_ot))
            .filter(mantenimiento_calendario::Column::IdMantenimientoCalendario.eq(single_id))
            .exec(&db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(Json(ot.id_ot))
}

pub async fn get_work_orders(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let orders = orden_trabajo::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let techs = tecnicos::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let providers = proveedores::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let m_types = mantenimiento_tipo::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let schedules: Vec<(mantenimiento_calendario::Model, Option<activos_equipos::Model>)> = mantenimiento_calendario::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<WorkOrderDto> = orders.into_iter().map(|(ot, activo)| {
        let nombre_tecnico = ot.id_tecnico.and_then(|id| {
            techs.iter().find(|t| t.id_tecnico == id).map(|t| format!("{} {}", t.nombre, t.apellido).trim().to_string())
        });

        let nombre_proveedor = ot.id_proveedor.and_then(|id| {
            providers.iter().find(|p| p.id_proveedor == id).map(|p| p.nombre_proveedor.clone())
        });

        let nombre_tipo_mantenimiento = ot.id_tipo_mantenimiento.and_then(|id| {
            m_types.iter().find(|t| t.id_tipo_mantenimiento == id).map(|t| t.nombre_tipo.clone())
        });

        let mantenimiento_costo_estimado = ot.id_calendario.and_then(|id| {
            schedules.iter().find(|(s, _)| s.id_mantenimiento_calendario == id).and_then(|(s, _)| s.costo_estimado.map(|c| c.to_string().parse().unwrap_or(0.0)))
        });

        // Find linked maintenances (Both legacy id_calendario relation AND new orden_trabajo_id relation)
        // We filter schedules where orden_trabajo_id == ot.id OR id == ot.id_calendario
        let linked: Vec<MaintenanceSimpleDto> = schedules.iter()
            .filter(|(s, _)| s.orden_trabajo_id == Some(ot.id_ot) || (ot.id_calendario.is_some() && Some(s.id_mantenimiento_calendario) == ot.id_calendario))
            .map(|(s, e)| MaintenanceSimpleDto {
                id: s.id_mantenimiento_calendario,
                equipo: e.as_ref().map(|a| a.nombre_equipo.clone()).unwrap_or("Desconocido".to_string()),
                tipo: m_types.iter().find(|t| t.id_tipo_mantenimiento == s.tipo_mantenimiento_id).map(|t| t.nombre_tipo.clone()).unwrap_or("Mantenimiento".to_string()),
                fecha: s.fecha_programada.map(|d| d.to_string()),
            })
            .collect();
            
        // Correcting the 'equipo' field in map above: 
        // We need 'activos_equipos' list to map names.
        // references 'schedules' and 'm_types'.

        WorkOrderDto {
            id_ot: ot.id_ot,
            id_calendario: ot.id_calendario,
            id_activo: ot.id_activo,
            id_tipo_mantenimiento: ot.id_tipo_mantenimiento,
            nombre_tipo_mantenimiento,
            id_tecnico: ot.id_tecnico,
            id_proveedor: ot.id_proveedor,
            estado: ot.estado,
            prioridad: ot.prioridad,
            observaciones: ot.observaciones,
            codigo_ot: ot.codigo_ot,
            created_at: ot.created_at,
            activo,
            nombre_tecnico,
            nombre_proveedor,
            codigo_mantenimiento: ot.id_calendario.and_then(|id| {
                schedules.iter().find(|(s, _)| s.id_mantenimiento_calendario == id).and_then(|(s, _)| s.codigo_mantenimiento.clone())
            }),
            costo_estimado: ot.costo_estimado.map(|c| c.to_string().parse().unwrap_or(0.0)),
            terminos_pago: ot.terminos_pago,
            mantenimiento_costo_estimado,
            mantenimientos: linked,
        }
    }).collect();

    Ok(Json(dtos))
}

#[derive(Deserialize)]
pub struct UpdateOtStatusRequest {
    pub estado: String,
}

pub async fn update_work_order_status(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateOtStatusRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    let mut ot_active: orden_trabajo::ActiveModel = ot.into();
    ot_active.estado = Set(Some(payload.estado));
    
    ot_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Status updated"))
}

pub async fn update_work_order(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateWorkOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    let mut ot_active: orden_trabajo::ActiveModel = ot.into();
    
    if let Some(tecnico_id) = payload.id_tecnico {
        ot_active.id_tecnico = Set(Some(tecnico_id));
    } else {
        ot_active.id_tecnico = Set(None);
    }

    if let Some(proveedor_id) = payload.id_proveedor {
        ot_active.id_proveedor = Set(Some(proveedor_id));
    } else {
        ot_active.id_proveedor = Set(None);
    }

    if let Some(prioridad) = payload.prioridad {
        ot_active.prioridad = Set(Some(prioridad));
    }

    if let Some(observaciones) = payload.observaciones {
        ot_active.observaciones = Set(Some(observaciones));
    }

    if let Some(tipo_id) = payload.id_tipo_mantenimiento {
        ot_active.id_tipo_mantenimiento = Set(Some(tipo_id));
    }

    if let Some(calendario_id_opt) = payload.id_calendario {
        ot_active.id_calendario = Set(calendario_id_opt);
    }

    if let Some(costo) = payload.costo_estimado {
        ot_active.costo_estimado = Set(Some(sea_orm::prelude::Decimal::from_str(&costo.to_string()).unwrap_or_default()));
    }

    if let Some(terminos) = payload.terminos_pago {
        ot_active.terminos_pago = Set(Some(terminos));
    }

    ot_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Work Order updated"))
}

pub async fn delete_work_order(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    let ot_active: orden_trabajo::ActiveModel = ot.into();
    ot_active.delete(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Work Order deleted"))
}
