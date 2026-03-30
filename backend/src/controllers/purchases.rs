use axum::{
    extract::{Path, State, Extension},
    http::StatusCode,
    Json,
    response::IntoResponse,
};
use sea_orm::{prelude::*, QueryOrder, TransactionTrait, Set};
use serde::{Deserialize, Serialize};
use chrono::{Local, NaiveDate};
use crate::entities::{inventario_movimientos, *};
use crate::utils::{error::AppError, audit};
use crate::utils::jwt::Claims;

#[derive(Serialize)]
pub struct PurchaseRequestDto {
    pub id: i32,
    pub solicitante_id: i32,
    pub fecha_solicitud: NaiveDate,
    pub motivo: String,
    pub estado: String,
    pub prioridad: String,
    pub created_at: Option<DateTimeWithTimeZone>,
    pub detalles: Vec<PurchaseRequestDetailDto>,
}

#[derive(Serialize)]
pub struct PurchaseRequestDetailDto {
    pub id: i32,
    pub solicitud_id: i32,
    pub repuesto_id: Option<i32>,
    pub descripcion_item: Option<String>,
    pub cantidad: i32,
}

#[derive(Serialize)]
pub struct PurchaseOrderDto {
    pub id_orden_compra: i32,
    pub id_proveedor: Option<i32>,
    pub nombre_proveedor: Option<String>,
    pub fecha_solicitud: Option<NaiveDate>,
    pub estado: Option<String>,
    pub total: Option<Decimal>,
    pub codigo_compra: Option<String>,
    pub solicitud_id: Option<i32>,
    pub estado_recepcion: Option<String>,
    pub created_at: Option<DateTimeWithTimeZone>,
}

#[derive(Deserialize)]
pub struct CreatePurchaseRequestDto {
    pub solicitante_id: i32,
    pub fecha_solicitud: NaiveDate,
    pub motivo: String,
    pub prioridad: String,
    pub detalles: Vec<CreatePurchaseRequestDetailDto>,
}

#[derive(Deserialize)]
pub struct CreatePurchaseRequestDetailDto {
    pub repuesto_id: Option<i32>,
    pub descripcion_item: Option<String>,
    pub cantidad: i32,
}

#[derive(Deserialize, Debug)]
pub struct UpdatePurchaseRequestStatusDto {
    pub estado: String,
}

#[derive(Serialize)]
pub struct OrderDetailWithPartDto {
    pub id_detalle: i32,
    pub id_orden_compra: i32,
    pub id_repuesto: i32,
    pub cantidad: i32,
    pub costo_unitario: Option<Decimal>,
    pub nombre_repuesto: Option<String>,
    pub codigo_repuesto: Option<String>,
    pub cantidad_recibida: Option<i32>,
}

#[derive(Serialize)]
pub struct OrderWithDetailsDto {
    pub id_orden_compra: i32,
    pub id_proveedor: Option<i32>,
    pub nombre_proveedor: Option<String>,
    pub fecha_solicitud: Option<NaiveDate>,
    pub estado: Option<String>,
    pub total: Option<Decimal>,
    pub subtotal: Option<Decimal>,
    pub impuestos: Option<Decimal>,
    pub codigo_compra: Option<String>,
    pub fecha_entrega: Option<NaiveDate>,
    pub terminos_pago: Option<String>,
    pub notas: Option<String>,
    pub estado_recepcion: Option<String>,
    pub items: Vec<OrderDetailWithPartDto>,
}

pub async fn get_orders(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let orders = orden_compra_repuesto::Entity::find()
        .find_also_related(proveedores::Entity)
        .order_by_asc(orden_compra_repuesto::Column::IdOrdenCompra)
        .all(&db)
        .await?;
    
    let dtos: Vec<PurchaseOrderDto> = orders.into_iter().map(|(o, p): (orden_compra_repuesto::Model, Option<proveedores::Model>)| PurchaseOrderDto {
        id_orden_compra: o.id_orden_compra,
        id_proveedor: o.id_proveedor,
        nombre_proveedor: p.map(|x| x.nombre_proveedor),
        fecha_solicitud: o.fecha_solicitud,
        estado: o.estado,
        total: o.total,
        codigo_compra: o.codigo_compra,
        solicitud_id: o.solicitud_id,
        estado_recepcion: o.estado_recepcion,
        created_at: o.created_at,
    }).collect();
    
    Ok(Json(dtos))
}

pub async fn get_requests(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let requests = compras_solicitudes::Entity::find()
        .order_by_asc(compras_solicitudes::Column::Id)
        .all(&db)
        .await?;
    
    Ok(Json(requests))
}

pub async fn create_request(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreatePurchaseRequestDto>,
) -> Result<impl IntoResponse, AppError> {
    let txn = db.begin().await?;

    let new_request = compras_solicitudes::ActiveModel {
        solicitante_id: Set(payload.solicitante_id),
        fecha_solicitud: Set(payload.fecha_solicitud),
        motivo: Set(payload.motivo.clone()),
        estado: Set("PENDIENTE".to_string()),
        prioridad: Set(payload.prioridad),
        ..Default::default()
    };

    let inserted_request = new_request.insert(&txn).await?;
    let request_id = inserted_request.id;

    for detail in payload.detalles {
        let new_detail = compras_solicitud_detalle::ActiveModel {
            solicitud_id: Set(request_id),
            repuesto_id: Set(detail.repuesto_id),
            descripcion_item: Set(detail.descripcion_item),
            cantidad: Set(detail.cantidad),
            ..Default::default()
        };
        new_detail.insert(&txn).await?;
    }
    audit::log_action(
        &txn,
        claims.user_id,
        "CREATE_REQUEST",
        "compras_solicitudes",
        Some(request_id),
        Some(format!("Solicitud de compra creada: {}", payload.motivo)),
        None,
    ).await;

    txn.commit().await?;

    Ok((StatusCode::CREATED, Json(inserted_request)))
}

pub async fn get_request_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let request = compras_solicitudes::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Request not found".to_string()))?;

    let details = compras_solicitud_detalle::Entity::find()
        .filter(compras_solicitud_detalle::Column::SolicitudId.eq(id))
        .all(&db)
        .await?;

    let details_dto: Vec<PurchaseRequestDetailDto> = details.into_iter().map(|d| PurchaseRequestDetailDto {
        id: d.id,
        solicitud_id: d.solicitud_id,
        repuesto_id: d.repuesto_id,
        descripcion_item: d.descripcion_item,
        cantidad: d.cantidad,
    }).collect();

    let response_dto = PurchaseRequestDto {
        id: request.id,
        solicitante_id: request.solicitante_id,
        fecha_solicitud: request.fecha_solicitud,
        motivo: request.motivo,
        estado: request.estado,
        prioridad: request.prioridad,
        created_at: request.created_at,
        detalles: details_dto,
    };

    Ok(Json(response_dto))
}

pub async fn update_request_status(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdatePurchaseRequestStatusDto>,
) -> Result<impl IntoResponse, AppError> {
    let mut request: compras_solicitudes::ActiveModel = compras_solicitudes::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Request not found".to_string()))?
        .into();

    request.estado = Set(payload.estado.clone());

    let updated_request = request.update(&db).await?;

    audit::log_action(
        &db,
        claims.user_id,
        "UPDATE_REQUEST_STATUS",
        "compras_solicitudes",
        Some(id),
        Some(format!("Estado de solicitud {} cambiado a: {}", id, updated_request.estado)),
        None,
    ).await;

    Ok(Json(updated_request))
}

#[derive(Deserialize)]
pub struct CreateOrderFromRequestDto {
    pub proveedor_id: i32,
}

#[derive(Deserialize)]
pub struct DirectOrderDetailDto {
    pub repuesto_id: i32,
    pub cantidad: i32,
    pub costo_unitario: Decimal,
    pub _impuesto: Option<Decimal>,
}

#[derive(Deserialize)]
pub struct CreateDirectOrderDto {
    pub proveedor_id: i32,
    pub fecha_entrega: Option<NaiveDate>,
    pub terminos_pago: Option<String>,
    pub notas: Option<String>,
    pub items: Vec<DirectOrderDetailDto>,
    pub subtotal: Decimal,
    pub impuestos: Decimal,
    pub total: Decimal,
}

pub async fn create_order_from_request(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(request_id): Path<i32>,
    Json(payload): Json<CreateOrderFromRequestDto>,
) -> Result<impl IntoResponse, AppError> {
     let txn = db.begin().await?;

    let request = compras_solicitudes::Entity::find_by_id(request_id)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::NotFound("Request not found".to_string()))?;
    
    if request.estado != "APROBADA" {
         return Err(AppError::BadRequest("Request must be APPROVED to generate an order".to_string()));
    }

    let new_order = orden_compra_repuesto::ActiveModel {
        id_proveedor: Set(Some(payload.proveedor_id)),
        fecha_solicitud: Set(Some(Local::now().date_naive())),
        estado: Set(Some("PENDIENTE".to_string())),
        solicitud_id: Set(Some(request_id)),
        estado_recepcion: Set(Some("PENDIENTE".to_string())),
        ..Default::default()
    };
    
    let inserted_order = new_order.insert(&txn).await?;

    let details = compras_solicitud_detalle::Entity::find()
        .filter(compras_solicitud_detalle::Column::SolicitudId.eq(request_id))
        .all(&txn)
        .await?;

    for detail in details {
        if let Some(repuesto_id) = detail.repuesto_id {
             let new_order_detail = orden_compra_detalle::ActiveModel {
                id_orden_compra: Set(inserted_order.id_orden_compra),
                id_repuesto: Set(repuesto_id),
                cantidad: Set(detail.cantidad),
                ..Default::default()
            };
            new_order_detail.insert(&txn).await?;
        }
    }

    audit::log_action(
        &txn,
        claims.user_id,
        "CREATE_ORDER_FROM_REQUEST",
        "orden_compra_repuesto",
        Some(inserted_order.id_orden_compra),
        Some(format!("Orden de compra generada desde solicitud {}", request_id)),
        None,
    ).await;

    txn.commit().await?;

    Ok((StatusCode::CREATED, Json(inserted_order)))
}

pub async fn create_direct_order(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateDirectOrderDto>,
) -> Result<impl IntoResponse, AppError> {
     let txn = db.begin().await?;

    let next_code = crate::utils::code_generator::generate_next_code(&txn, "orden_compra_repuesto", "codigo_compra", "OC-").await?;

    let new_order = orden_compra_repuesto::ActiveModel {
        id_proveedor: Set(Some(payload.proveedor_id)),
        fecha_solicitud: Set(Some(Local::now().date_naive())),
        estado: Set(Some("PENDIENTE".to_string())),
        solicitud_id: Set(None),
        estado_recepcion: Set(Some("PENDIENTE".to_string())),
        codigo_compra: Set(Some(next_code)),
        fecha_entrega: Set(payload.fecha_entrega),
        terminos_pago: Set(payload.terminos_pago),
        notas: Set(payload.notas),
        subtotal: Set(Some(payload.subtotal)),
        impuestos: Set(Some(payload.impuestos)),
        total: Set(Some(payload.total)),
        ..Default::default()
    };
    
    let inserted_order = new_order.insert(&txn).await?;

    for item in payload.items {
         let new_order_detail = orden_compra_detalle::ActiveModel {
            id_orden_compra: Set(inserted_order.id_orden_compra),
            id_repuesto: Set(item.repuesto_id),
            cantidad: Set(item.cantidad),
            costo_unitario: Set(Some(item.costo_unitario)),
            ..Default::default()
        };
        new_order_detail.insert(&txn).await?;
    }

    audit::log_action(
        &txn,
        claims.user_id,
        "CREATE_ORDER",
        "orden_compra_repuesto",
        Some(inserted_order.id_orden_compra),
        Some(format!("Orden de compra directa creada: {}", inserted_order.codigo_compra.clone().unwrap_or_default())),
        None,
    ).await;

    txn.commit().await?;

    Ok((StatusCode::CREATED, Json(inserted_order)))
}

pub async fn get_order_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let order = orden_compra_repuesto::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    let details = orden_compra_detalle::Entity::find()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(id))
        .find_also_related(activos_repuestos::Entity)
        .all(&db)
        .await?;

    let items: Vec<OrderDetailWithPartDto> = details
        .into_iter()
        .map(|(d, p): (orden_compra_detalle::Model, Option<activos_repuestos::Model>)| OrderDetailWithPartDto {
            id_detalle: d.id_detalle,
            id_orden_compra: d.id_orden_compra,
            id_repuesto: d.id_repuesto,
            cantidad: d.cantidad,
            costo_unitario: d.costo_unitario,
            nombre_repuesto: p.as_ref().map(|x| x.nombre_repuesto.clone()),
            codigo_repuesto: p.as_ref().map(|x| x.codigo_repuesto.clone()),
            cantidad_recibida: Some(d.cantidad_recibida),
        })
        .collect();

    let prov = if let Some(pid) = order.id_proveedor {
        crate::entities::proveedores::Entity::find_by_id(pid)
            .one(&db)
            .await?
    } else {
        None
    };

    let dto = OrderWithDetailsDto {
        id_orden_compra: order.id_orden_compra,
        id_proveedor: order.id_proveedor,
        nombre_proveedor: prov.map(|p| p.nombre_proveedor),
        fecha_solicitud: order.fecha_solicitud,
        estado: order.estado,
        total: order.total,
        subtotal: order.subtotal,
        impuestos: order.impuestos,
        codigo_compra: order.codigo_compra,
        fecha_entrega: order.fecha_entrega,
        terminos_pago: order.terminos_pago,
        notas: order.notas,
        estado_recepcion: order.estado_recepcion,
        items,
    };

    Ok(Json(dto))
}

pub async fn update_order(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateDirectOrderDto>,
) -> Result<impl IntoResponse, AppError> {
    let txn = db.begin().await?;

    let order = orden_compra_repuesto::Entity::find_by_id(id)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    let mut order: orden_compra_repuesto::ActiveModel = order.into();

    order.id_proveedor = Set(Some(payload.proveedor_id));
    order.fecha_entrega = Set(payload.fecha_entrega);
    order.terminos_pago = Set(payload.terminos_pago);
    order.notas = Set(payload.notas);
    order.subtotal = Set(Some(payload.subtotal));
    order.impuestos = Set(Some(payload.impuestos));
    order.total = Set(Some(payload.total));

    order.update(&txn).await?;

    orden_compra_detalle::Entity::delete_many()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(id))
        .exec(&txn)
        .await?;

    for item in payload.items {
        let new_detail = orden_compra_detalle::ActiveModel {
            id_orden_compra: Set(id),
            id_repuesto: Set(item.repuesto_id),
            cantidad: Set(item.cantidad),
            costo_unitario: Set(Some(item.costo_unitario)),
            ..Default::default()
        };
        new_detail.insert(&txn).await?;
    }

    txn.commit().await?;

    Ok(StatusCode::OK)
}

pub async fn update_order_status(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdatePurchaseRequestStatusDto>,
) -> Result<impl IntoResponse, AppError> {
    let order = orden_compra_repuesto::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    let mut order: orden_compra_repuesto::ActiveModel = order.into();
    tracing::info!("Updating order {} status to: {}", id, payload.estado);
    order.estado = Set(Some(payload.estado.clone()));

    let updated = order.update(&db).await?;

    audit::log_action(
        &db,
        claims.user_id,
        "UPDATE_ORDER_STATUS",
        "orden_compra_repuesto",
        Some(id),
        Some(format!("Estado de orden {} cambiado a: {}", id, payload.estado)),
        None,
    ).await;

    Ok(Json(updated))
}

pub async fn delete_order(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let txn = db.begin().await?;

    orden_compra_detalle::Entity::delete_many()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(id))
        .exec(&txn)
        .await?;

    orden_compra_repuesto::Entity::delete_by_id(id)
        .exec(&txn)
        .await?;

    txn.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
pub struct ReceiveOrderItemDto {
    pub id_detalle: i32,
    pub cantidad_recibir: i32,
    pub bodega_id: Option<i32>,
    pub ubicacion_bodega_id: Option<i32>,
}

#[derive(Deserialize)]
pub struct ReceiveOrderDto {
    pub items: Vec<ReceiveOrderItemDto>,
}

pub async fn receive_order_items(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<crate::utils::jwt::Claims>,
    Path(order_id): Path<i32>,
    Json(payload): Json<ReceiveOrderDto>,
) -> Result<impl IntoResponse, AppError> {
    let txn = db.begin().await?;

    let order = orden_compra_repuesto::Entity::find_by_id(order_id)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    let mut order_active: orden_compra_repuesto::ActiveModel = order.into();
    let mut some_items_received = false;

    for item in payload.items {
        if item.cantidad_recibir <= 0 { continue; }

        let detail = orden_compra_detalle::Entity::find_by_id(item.id_detalle)
            .one(&txn)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Detail {} not found", item.id_detalle)))?;

        let mut detail: orden_compra_detalle::ActiveModel = detail.into();

        let current_received = detail.cantidad_recibida.clone().unwrap();
        let ordered = detail.cantidad.clone().unwrap();
        
        if current_received + item.cantidad_recibir > ordered {
             return Err(AppError::BadRequest(format!("Cannot receive more than ordered for detail {}", item.id_detalle)));
        }

        detail.cantidad_recibida = Set(current_received + item.cantidad_recibir);
        let repuesto_id = detail.id_repuesto.clone().unwrap();

        detail.update(&txn).await?;

        use sea_orm::{sea_query::Expr};
        
        let mut update_query = activos_repuestos::Entity::update_many()
            .col_expr(
                activos_repuestos::Column::StockActual,
                Expr::col(activos_repuestos::Column::StockActual).add(item.cantidad_recibir)
            )
            .filter(activos_repuestos::Column::IdRepuesto.eq(repuesto_id));

        if let Some(bid) = item.bodega_id {
            update_query = update_query.col_expr(activos_repuestos::Column::BodegaId, Expr::val(bid).into());
        }
        if let Some(ubid) = item.ubicacion_bodega_id {
            update_query = update_query.col_expr(activos_repuestos::Column::UbicacionBodegaId, Expr::val(ubid).into());
        }

        update_query.exec(&txn).await?;

        let movement = inventario_movimientos::ActiveModel {
            repuesto_id: Set(repuesto_id),
            tipo: Set("ENTRADA_COMPRA".to_string()),
            cantidad: Set(item.cantidad_recibir),
            referencia_id: Set(Some(order_id)),
            fecha: Set(Some(Local::now().into())),
            usuario_id: Set(claims.user_id),
            ..Default::default()
        };
        movement.insert(&txn).await?;
        
        some_items_received = true;
    }

    let details = orden_compra_detalle::Entity::find()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(order_id))
        .all(&txn)
        .await?;

    let mut fully_received = true;
    for d in details {
        if d.cantidad_recibida < d.cantidad {
            fully_received = false;
            break;
        }
    }

    if fully_received {
        order_active.estado_recepcion = Set(Some("COMPLETA".to_string()));
        order_active.estado = Set(Some("RECIBIDA".to_string()));
    } else if some_items_received {
        order_active.estado_recepcion = Set(Some("PARCIAL".to_string()));
    } else {
        order_active.estado_recepcion = Set(Some("PENDIENTE".to_string()));
    }

    let updated_order = order_active.clone().update(&txn).await?;

    audit::log_action(
        &txn,
        claims.user_id,
        "RECEIVE_ORDER",
        "orden_compra_repuesto",
        Some(order_id),
        Some(format!("Recepción de orden {}: {}", order_id, updated_order.estado_recepcion.clone().unwrap_or_default())),
        None,
    ).await;

    txn.commit().await?;

    Ok(StatusCode::OK)
}

pub async fn send_order_email(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<crate::utils::jwt::Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<crate::controllers::purchase_quotes::SendEmailRequest>,
) -> Result<impl IntoResponse, AppError> {
    let order = orden_compra_repuesto::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    // Determine target emails
    let mut target_emails: Vec<String> = if let Some(e) = payload.email {
        e.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
    } else {
        if let Some(pid) = order.id_proveedor {
            let prov = proveedores::Entity::find_by_id(pid)
                .one(&db)
                .await?
                .ok_or_else(|| AppError::NotFound("Provider not found".to_string()))?;
            let email = prov.email.ok_or_else(|| AppError::BadRequest("Provider has no email and none provided".to_string()))?;
            vec![email]
        } else {
            return Err(AppError::BadRequest("Order has no provider and no email provided".to_string()));
        }
    };

    // Add sender CC
    let user = crate::entities::usuarios::Entity::find_by_id(claims.user_id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
    
    if !target_emails.contains(&user.email) {
        target_emails.push(user.email);
    }

    let final_to = target_emails.join(",");

    // Decode PDF
    use base64::{Engine as _, engine::general_purpose};
    let pdf_data = general_purpose::STANDARD
        .decode(&payload.pdf_base64)
        .map_err(|e| AppError::BadRequest(format!("Invalid Base64: {}", e)))?;

    // Send Email
    let subject = format!("Orden de Compra {}", order.codigo_compra.as_deref().unwrap_or(""));
    let body = format!(
        "Estimado proveedor,<br><br>Adjunto encontrará la orden de compra {}.<br><br>Saludos,<br>Hotel A",
        order.codigo_compra.as_deref().unwrap_or("")
    );

    crate::utils::mailer::send_email_with_attachment(
        &db,
        &final_to,
        &subject,
        &body,
        "orden_compra.pdf",
        pdf_data,
        "application/pdf"
    ).await.map_err(|e| AppError::Internal(e))?;

    // Update status to ENVIADA (if it was APROBADA)
    if order.estado.as_deref() == Some("APROBADA") {
        let mut active: orden_compra_repuesto::ActiveModel = order.into();
        active.estado = Set(Some("ENVIADA".to_string()));
        active.update(&db).await?;
    }

    audit::log_action(
        &db,
        claims.user_id,
        "SEND_ORDER_EMAIL",
        "orden_compra_repuesto",
        Some(id),
        Some(format!("Orden de compra {} enviada a: {}", id, final_to)),
        None,
    ).await;

    Ok(Json("Email sent successfully".to_string()))
}
