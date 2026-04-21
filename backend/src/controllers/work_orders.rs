use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryOrder, QueryFilter, ColumnTrait, DbErr};
use serde::{Deserialize, Serialize};
use crate::entities::{orden_trabajo, activos_equipos, tecnicos, proveedores, mantenimiento_tipo, mantenimiento_calendario, ubicaciones, orden_trabajo_comentarios, usuarios};
use crate::utils::{audit, jwt::Claims};
use std::str::FromStr;
use base64::{Engine as _, engine::general_purpose};

#[derive(Deserialize)]
pub struct CreateWorkOrderRequest {
    pub id_calendario: Option<i32>,
    pub id_calendarios: Option<Vec<i32>>, // Support multiple
    pub id_activo: Option<i32>,
    pub id_ubicacion: Option<i32>,
    pub tipo_ot: Option<String>,
    pub id_tipo_mantenimiento: i32,
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub asunto: Option<String>,
    pub costo_estimado: Option<f64>,
    pub terminos_pago: Option<String>,
    pub foto_dano: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateWorkOrderRequest {
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub asunto: Option<String>,
    pub id_tipo_mantenimiento: Option<i32>,
    pub id_calendario: Option<Option<i32>>,
    pub id_calendarios: Option<Vec<i32>>, // Support multiple
    pub id_activo: Option<Option<i32>>,
    pub id_ubicacion: Option<Option<i32>>,
    pub tipo_ot: Option<String>,
    pub costo_estimado: Option<f64>,
    pub terminos_pago: Option<String>,
    pub comentario_final: Option<String>,
    pub foto_dano: Option<String>,
    pub estado: Option<String>,
}

#[derive(Serialize)]
pub struct WorkOrderDto {
    pub id_ot: i32,
    pub id_calendario: Option<i32>,
    pub id_activo: Option<i32>,
    pub id_ubicacion: Option<i32>,
    pub nombre_ubicacion: Option<String>,
    pub tipo_ot: Option<String>,
    pub id_tipo_mantenimiento: Option<i32>,
    pub nombre_tipo_mantenimiento: Option<String>,
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub estado: Option<String>,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub asunto: Option<String>,
    pub comentario_final: Option<String>,
    pub foto_dano: Option<String>,
    pub codigo_ot: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub fecha_creacion: Option<chrono::DateTime<chrono::FixedOffset>>, // Alias
    pub fecha_cierre: Option<chrono::NaiveDateTime>, // Alias for fecha_fin_real
    pub activo: Option<activos_equipos::Model>,
    pub nombre_tecnico: Option<String>,
    pub nombre_proveedor: Option<String>,
    pub codigo_mantenimiento: Option<String>,
    pub costo_estimado: Option<f64>,
    pub terminos_pago: Option<String>,
    pub mantenimiento_costo_estimado: Option<f64>,
    pub mantenimientos: Vec<MaintenanceSimpleDto>,
    pub mantenimientos_vinc_detalles: Vec<MaintenanceSimpleDto>, // For frontend compatibility
    pub id_calendarios: Vec<i32>, // List of IDs for easy hydration
    pub id_usuario: Option<i32>,
    pub nombre_usuario: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct MaintenanceSimpleDto {
    pub id: i32,
    pub equipo: String,
    pub tipo: String,
    pub fecha: Option<String>,
    pub codigo: Option<String>, // Added
    pub tecnico_id: Option<i32>, // Added
    pub proveedor_id: Option<i32>, // Added
    pub equipo_id: i32, // Added
    pub tipo_mantenimiento_id: i32, // Added
    pub prioridad: Option<String>, // Added
    pub costo_estimado: Option<f64>, // Added
    pub asunto: Option<String>,
}

pub async fn create_work_order(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateWorkOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Generate sequential code
    let next_code = crate::utils::code_generator::generate_next_code(&db, "orden_trabajo", "codigo_ot", "OT-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_ot = orden_trabajo::ActiveModel {
        id_calendario: Set(payload.id_calendario),
        id_activo: Set(payload.id_activo),
        tipo_ot: Set(payload.tipo_ot.unwrap_or_else(|| "Preventiva".to_string())),
        id_ubicacion: Set(payload.id_ubicacion),
        id_tipo_mantenimiento: Set(Some(payload.id_tipo_mantenimiento)),
        id_tecnico: Set(payload.id_tecnico),
        id_proveedor: Set(payload.id_proveedor),
        prioridad: Set(payload.prioridad),
        observaciones: Set(payload.observaciones),
        asunto: Set(payload.asunto),
        codigo_ot: Set(Some(next_code)),
        estado: Set(Some("abierta".to_string())),
        costo_estimado: Set(payload.costo_estimado.map(|c| sea_orm::prelude::Decimal::from_str(&c.to_string()).unwrap_or_default())),
        terminos_pago: Set(payload.terminos_pago),
        foto_dano: Set(payload.foto_dano),
        id_usuario: Set(Some(claims.user_id)),
        ..Default::default()
    };

    let ot = new_ot.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Link multiple maintenance plans if provided
    if let Some(ids) = payload.id_calendarios {
        for m_id in ids {
            if let Ok(Some(m_plan)) = mantenimiento_calendario::Entity::find_by_id(m_id).one(&db).await {
                let mut m_active: mantenimiento_calendario::ActiveModel = m_plan.into();
                m_active.orden_trabajo_id = Set(Some(ot.id_ot));
                let _ = m_active.update(&db).await;
            }
        }
    }
    
    audit::log_action(
        &db,
        claims.user_id,
        "CREATE",
        "orden_trabajo",
        Some(ot.id_ot),
        Some(format!("Orden de trabajo creada: {}", ot.codigo_ot.clone().unwrap_or_default())),
        None,
    ).await;
    
    Ok(Json(ot.id_ot))
}

pub async fn get_work_order(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<crate::utils::jwt::Claims>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .find_also_related(activos_equipos::Entity)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    // Validación de propiedad: si no es admin, debe ser el dueño
    tracing::info!("Verificando propiedad de OT {}: usuario_id={:?}, claims.user_id={}", id, ot.0.id_usuario, claims.user_id);
    if !claims.permisos.contains(&"work_orders_view".to_string()) {
        if ot.0.id_usuario != Some(claims.user_id) {
            tracing::warn!("Acceso DENEGADO a OT {}: usuario {} no es dueño", id, claims.user_id);
            return Err((StatusCode::FORBIDDEN, "No tiene permisos para ver esta orden".to_string()));
        }
    }
    tracing::info!("Acceso CONCEDIDO a OT {} para usuario {}", id, claims.user_id);

    let users = usuarios::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let ot_model = ot.0.clone();
    let nombre_usuario = ot_model.id_usuario.and_then(|id| {
        users.iter().find(|u| u.id_usuario == id).map(|u| format!("{} {}", u.nombre, u.apellido).trim().to_string())
    });

    let (ot, activo) = ot;

    let locations = ubicaciones::Entity::find().all(&db).await
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

    let linked: Vec<MaintenanceSimpleDto> = schedules.iter()
        .filter(|(s, _)| {
            // Check both: the direct FK in maintenance_calendario (new way) 
            // and the FK in orden_trabajo (legacy way)
            s.orden_trabajo_id == Some(ot.id_ot) || (ot.id_calendario.is_some() && s.id_mantenimiento_calendario == ot.id_calendario.unwrap())
        })
        .map(|(s, e)| MaintenanceSimpleDto {
            id: s.id_mantenimiento_calendario,
            equipo: e.as_ref().map(|a| a.nombre_equipo.clone()).unwrap_or("Desconocido".to_string()),
            tipo: m_types.iter().find(|t| t.id_tipo_mantenimiento == s.tipo_mantenimiento_id).map(|t| t.nombre_tipo.clone()).unwrap_or("Mantenimiento".to_string()),
            fecha: s.fecha_programada.map(|d| d.to_string()),
            codigo: s.codigo_mantenimiento.clone(),
            tecnico_id: s.tecnico_id,
            proveedor_id: s.proveedor_id,
            equipo_id: s.equipo_id,
            tipo_mantenimiento_id: s.tipo_mantenimiento_id,
            prioridad: s.prioridad.clone(),
            costo_estimado: s.costo_estimado.map(|c| c.to_string().parse().unwrap_or(0.0)),
            asunto: s.asunto.clone(),
        })
        .collect();

    let nombre_ubicacion = ot.id_ubicacion.and_then(|id| {
        locations.iter().find(|l| l.id == id).map(|l| l.nombre.clone())
    });

    let dto = WorkOrderDto {
        id_ot: ot.id_ot,
        id_calendario: ot.id_calendario,
        id_activo: ot.id_activo,
        id_ubicacion: ot.id_ubicacion,
        nombre_ubicacion,
        tipo_ot: Some(ot.tipo_ot.clone()),
        id_tipo_mantenimiento: ot.id_tipo_mantenimiento,
        nombre_tipo_mantenimiento,
        id_tecnico: ot.id_tecnico,
        id_proveedor: ot.id_proveedor,
        estado: ot.estado.clone(),
        prioridad: ot.prioridad.clone(),
        observaciones: ot.observaciones.clone(),
        asunto: ot.asunto.clone(),
        comentario_final: ot.comentario_final.clone(),
        codigo_ot: ot.codigo_ot.clone(),
        created_at: ot.created_at,
        fecha_creacion: ot.created_at,
        fecha_cierre: ot.fecha_fin_real,
        activo: activo,
        nombre_tecnico,
        nombre_proveedor,
        codigo_mantenimiento: ot.id_calendario.and_then(|id| {
            schedules.iter().find(|(s, _)| s.id_mantenimiento_calendario == id).and_then(|(s, _)| s.codigo_mantenimiento.clone())
        }),
        costo_estimado: ot.costo_estimado.map(|c| c.to_string().parse().unwrap_or(0.0)),
        terminos_pago: ot.terminos_pago.clone(),
        foto_dano: ot.foto_dano.clone(),
        mantenimiento_costo_estimado,
        id_calendarios: linked.iter().map(|l| l.id).collect(),
        mantenimientos_vinc_detalles: linked.clone(),
        mantenimientos: linked,
        id_usuario: ot.id_usuario,
        nombre_usuario,
    };

    Ok(Json(dto))
}

pub async fn get_work_orders(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<crate::utils::jwt::Claims>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut query = orden_trabajo::Entity::find().find_also_related(activos_equipos::Entity);

    // Filter by user if not ADMIN/SUPER-ADMIN AND doesn't have 'solicitudes_view_all' permission
    let is_admin = claims.role == "ADMIN" || claims.role == "SUPER-ADMIN" || claims.role == "ADMINISTRADOR";
    let can_view_all = claims.permisos.iter().any(|p| p == "solicitudes_view_all");

    if !is_admin && !can_view_all {
        query = query.filter(orden_trabajo::Column::IdUsuario.eq(claims.user_id));
    }

    let orders = query.order_by_desc(orden_trabajo::Column::CreatedAt)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let locations = ubicaciones::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let techs = tecnicos::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let providers = proveedores::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let m_types = mantenimiento_tipo::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let users = usuarios::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let schedules: Vec<(mantenimiento_calendario::Model, Option<activos_equipos::Model>)> = mantenimiento_calendario::Entity::find()
        .find_also_related(activos_equipos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<WorkOrderDto> = orders.into_iter().map(|(ot, activo)| {
        let nombre_usuario = ot.id_usuario.and_then(|id| {
            users.iter().find(|u| u.id_usuario == id).map(|u| format!("{} {}", u.nombre, u.apellido).trim().to_string())
        });
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

        // Find linked maintenances (Check both FK directions)
        let linked: Vec<MaintenanceSimpleDto> = schedules.iter()
            .filter(|(s, _)| {
                s.orden_trabajo_id == Some(ot.id_ot) || (ot.id_calendario.is_some() && s.id_mantenimiento_calendario == ot.id_calendario.unwrap())
            })
            .map(|(s, e)| MaintenanceSimpleDto {
                id: s.id_mantenimiento_calendario,
                equipo: e.as_ref().map(|a| a.nombre_equipo.clone()).unwrap_or("Desconocido".to_string()),
                tipo: m_types.iter().find(|t| t.id_tipo_mantenimiento == s.tipo_mantenimiento_id).map(|t| t.nombre_tipo.clone()).unwrap_or("Mantenimiento".to_string()),
                fecha: s.fecha_programada.map(|d| d.to_string()),
                codigo: s.codigo_mantenimiento.clone(),
                tecnico_id: s.tecnico_id,
                proveedor_id: s.proveedor_id,
                equipo_id: s.equipo_id,
                tipo_mantenimiento_id: s.tipo_mantenimiento_id,
                prioridad: s.prioridad.clone(),
                costo_estimado: s.costo_estimado.map(|c| c.to_string().parse().unwrap_or(0.0)),
                asunto: s.asunto.clone(),
            })
            .collect();

        let nombre_ubicacion = ot.id_ubicacion.and_then(|id| {
            locations.iter().find(|l| l.id == id).map(|l| l.nombre.clone())
        });

        WorkOrderDto {
            id_ot: ot.id_ot,
            id_calendario: ot.id_calendario,
            id_activo: ot.id_activo,
            id_ubicacion: ot.id_ubicacion,
            nombre_ubicacion,
            tipo_ot: Some(ot.tipo_ot.clone()),
            id_tipo_mantenimiento: ot.id_tipo_mantenimiento,
            nombre_tipo_mantenimiento,
            id_tecnico: ot.id_tecnico,
            id_proveedor: ot.id_proveedor,
            estado: ot.estado,
            prioridad: ot.prioridad,
            observaciones: ot.observaciones,
            asunto: ot.asunto,
            comentario_final: ot.comentario_final,
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
            foto_dano: ot.foto_dano,
            fecha_creacion: ot.created_at,
            fecha_cierre: ot.fecha_fin_real,
            mantenimiento_costo_estimado,
            id_calendarios: linked.iter().map(|l| l.id).collect(),
            mantenimientos_vinc_detalles: linked.clone(),
            mantenimientos: linked,
            id_usuario: ot.id_usuario,
            nombre_usuario,
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
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateOtStatusRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    // Validación de propiedad para actualización de estado
    if !claims.permisos.contains(&"work_orders_edit".to_string()) {
        if ot.id_usuario != Some(claims.user_id) {
            return Err((StatusCode::FORBIDDEN, "No tiene permisos para modificar esta orden".to_string()));
        }
        
        // Los usuarios de portal solo pueden cancelar (o pasar a otro estado permitido si aplica)
        // Por ahora permitimos el cambio si es suyo, pero idealmente solo a "CANCELADA"
        if payload.estado != "CANCELADA" {
             // Opcional: restringir más aquí si es necesario
        }
    }

    let mut ot_active: orden_trabajo::ActiveModel = ot.into();
    ot_active.estado = Set(Some(payload.estado.clone()));
    
    ot_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db,
        claims.user_id,
        "UPDATE_STATUS",
        "orden_trabajo",
        Some(id),
        Some(format!("Estado de OT {} cambiado a: {}", id, payload.estado)),
        None,
    ).await;

    Ok(Json("Status updated"))
}

pub async fn update_work_order(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateWorkOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    let _ot_id = ot.id_ot;
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

    if let Some(asunto) = payload.asunto {
        ot_active.asunto = Set(Some(asunto));
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

    if let Some(id_activo_opt) = payload.id_activo {
        ot_active.id_activo = Set(id_activo_opt);
    }

    if let Some(id_ubicacion_opt) = payload.id_ubicacion {
        ot_active.id_ubicacion = Set(id_ubicacion_opt);
    }

    if let Some(tipo_ot) = payload.tipo_ot {
        ot_active.tipo_ot = Set(tipo_ot);
    }

    if let Some(comentario) = payload.comentario_final {
        ot_active.comentario_final = Set(Some(comentario));
    }
    
    if let Some(foto) = payload.foto_dano {
        ot_active.foto_dano = Set(Some(foto));
    }

    ot_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Handle multiple maintenance plans synchronization
    if let Some(ids) = payload.id_calendarios {
        // 1. Unlink plans that were previously linked to this OT but are no longer in the list
        let previous_links = mantenimiento_calendario::Entity::find()
            .filter(mantenimiento_calendario::Column::OrdenTrabajoId.eq(id))
            .all(&db)
            .await
            .unwrap_or_default();
            
        for prev in previous_links {
            if !ids.contains(&prev.id_mantenimiento_calendario) {
                let mut m_active: mantenimiento_calendario::ActiveModel = prev.into();
                m_active.orden_trabajo_id = Set(None);
                let _ = m_active.update(&db).await;
            }
        }
        
        // 2. Link plans in the new list
        for m_id in ids {
            if let Ok(Some(m_plan)) = mantenimiento_calendario::Entity::find_by_id(m_id).one(&db).await {
                let mut m_active: mantenimiento_calendario::ActiveModel = m_plan.into();
                m_active.orden_trabajo_id = Set(Some(id));
                let _ = m_active.update(&db).await;
            }
        }
    }

    audit::log_action(
        &db,
        claims.user_id,
        "UPDATE",
        "orden_trabajo",
        Some(id),
        Some(format!("Orden de trabajo actualizada ID: {}", id)),
        None,
    ).await;

    Ok(Json("Work Order updated"))
}

pub async fn delete_work_order(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
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


    audit::log_action(
        &db,
        claims.user_id,
        "DELETE",
        "orden_trabajo",
        Some(id),
        Some(format!("Orden de trabajo eliminada ID: {}", id)),
        None,
    ).await;

    Ok(Json("Work Order deleted"))
}

#[derive(Deserialize)]
pub struct SendEmailRequest {
    pub email: Option<String>,
    pub pdf_base64: String,
}

pub async fn send_work_order_email(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<SendEmailRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .find_also_related(activos_equipos::Entity)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Orden de Trabajo no encontrada".to_string()))?;

    let (ot_model, activo) = ot;
    let codigo = ot_model.codigo_ot.clone().unwrap_or_else(|| format!("OT-{}", ot_model.id_ot));
    
    // Determine recipient
    // 1. Payload email (override)
    // 2. Technician email (if internal) - Not in simple schema, maybe user relation?
    // 3. Provider email (if external)
    let email_dest = if let Some(e) = payload.email {
        e
    } else if let Some(prov_id) = ot_model.id_proveedor {
         let prov = proveedores::Entity::find_by_id(prov_id).one(&db).await
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB Error".to_string()))?
            .ok_or((StatusCode::BAD_REQUEST, "Proveedor no encontrado".to_string()))?;
         prov.email.ok_or((StatusCode::BAD_REQUEST, "Proveedor sin correo".to_string()))?
    } else {
        return Err((StatusCode::BAD_REQUEST, "Debe especificar un correo de destino".to_string()));
    };

    // Decode PDF
    let pdf_data = general_purpose::STANDARD
        .decode(&payload.pdf_base64)
        .map_err(|_| (StatusCode::BAD_REQUEST, "PDF Base64 inválido".to_string()))?;

    // Send Email
    let subject = format!("Orden de Trabajo: {} - {}", codigo, activo.map(|a| a.nombre_equipo).unwrap_or_default());
    let body = format!(
        "<h2>Orden de Trabajo {}</h2><p>Adjunto encontrará la orden de trabajo solicitada.</p>",
        codigo
    );

    crate::utils::mailer::send_email_with_attachment(
        &db,
        &email_dest,
        &subject,
        &body,
        &format!("{}.pdf", codigo),
        pdf_data,
        "application/pdf"
    ).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    // Note: We do NOT update status automatically for Work Orders as per requirement

    Ok(Json("Correo enviado exitosamente"))
}
pub async fn finish_work_order(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateWorkOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let ot = orden_trabajo::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Work Order not found".to_string()))?;

    let comentario = payload.comentario_final.ok_or((StatusCode::BAD_REQUEST, "Se requiere un motivo para finalizar o cancelar la OT".to_string()))?;
    let nuevo_estado = payload.estado.unwrap_or_else(|| "cerrada".to_string());

    let mut ot_active: orden_trabajo::ActiveModel = ot.into();
    ot_active.estado = Set(Some(nuevo_estado.clone()));
    ot_active.comentario_final = Set(Some(comentario.clone()));
    ot_active.fecha_fin_real = Set(Some(chrono::Utc::now().naive_utc()));
    
    ot_active.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db,
        claims.user_id,
        "FINISH",
        "orden_trabajo",
        Some(id),
        Some(format!("Orden de trabajo finalizada ID: {}. Comentario: {}", id, comentario)),
        None,
    ).await;

    Ok(Json("Work Order finished"))
}

#[derive(Serialize)]
pub struct CommentDto {
    pub id_comentario: i32,
    pub comentario: String,
    pub fecha_hora: chrono::DateTime<chrono::FixedOffset>,
    pub nombre_usuario: String,
}

pub async fn get_comments(
    State(db): State<DatabaseConnection>,
    Path(ot_id_param): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let comments = orden_trabajo_comentarios::Entity::find()
        .filter(orden_trabajo_comentarios::Column::OtId.eq(ot_id_param))
        .find_also_related(usuarios::Entity)
        .order_by_asc(orden_trabajo_comentarios::Column::FechaHora)
        .all(&db)
        .await
        .map_err(|e: DbErr| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<CommentDto> = comments.into_iter().map(|(c, u): (orden_trabajo_comentarios::Model, Option<usuarios::Model>)| {
        CommentDto {
            id_comentario: c.id_comentario,
            comentario: c.comentario,
            fecha_hora: c.fecha_hora,
            nombre_usuario: u.map(|user| user.nombre).unwrap_or("Desconocido".to_string()),
        }
    }).collect();

    Ok(Json(dtos))
}

#[derive(Deserialize)]
pub struct AddCommentRequest {
    pub comentario: String,
}

pub async fn add_comment(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<AddCommentRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_comment = orden_trabajo_comentarios::ActiveModel {
        ot_id: Set(id),
        usuario_id: Set(claims.user_id),
        comentario: Set(payload.comentario),
        ..Default::default()
    };

    let comment = new_comment.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(comment.id_comentario))
}
