use axum::{
    extract::{Path, State, Extension},
    http::StatusCode,
    Json,
    response::IntoResponse,
};
use sea_orm::{prelude::*, QueryOrder, TransactionTrait, Set};
use serde::{Deserialize, Serialize};
use chrono::prelude::*;
use crate::entities::{prelude::*, inventario_movimientos, *};

#[derive(Serialize)]
pub struct PurchaseRequestDto {
    pub id: i32,
    pub solicitante_id: i32,
    pub fecha_solicitud: NaiveDate,
    pub motivo: String,
    pub estado: String,
    pub prioridad: String,
    pub created_at: Option<DateTimeWithTimeZone>,
    // details could be added here or fetched separately
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
    pub id: i32,
    pub id_proveedor: Option<i32>,
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

#[derive(Deserialize)]
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
    pub fecha_solicitud: Option<NaiveDate>,
    pub estado: Option<String>,
    pub total: Option<Decimal>,
    pub subtotal: Option<Decimal>,
    pub impuestos: Option<Decimal>,
    pub codigo_compra: Option<String>,
    pub fecha_entrega: Option<NaiveDate>,
    pub terminos_pago: Option<String>,
    pub notas: Option<String>,
    pub items: Vec<OrderDetailWithPartDto>,
}

// GET /api/purchases/orders
pub async fn get_orders(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let orders = OrdenCompraRepuesto::find()
        .order_by_desc(orden_compra_repuesto::Column::CreatedAt)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    Ok(Json(orders))
}

// Handler functions

// GET /api/purchases/requests
pub async fn get_requests(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let requests = ComprasSolicitudes::find()
        .order_by_desc(compras_solicitudes::Column::CreatedAt)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    // For a real app, we might want to fetch details eagerly or use a join, 
    // but for simplicity in MVP we can fetch basic info or a comprehensive DTO.
    // Let's keep it simple and just return the requests first.
    // Ideally we join with details later if needed.
    
    Ok(Json(requests))
}

// POST /api/purchases/requests
pub async fn create_request(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreatePurchaseRequestDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_request = compras_solicitudes::ActiveModel {
        solicitante_id: Set(payload.solicitante_id),
        fecha_solicitud: Set(payload.fecha_solicitud),
        motivo: Set(payload.motivo),
        estado: Set("PENDIENTE".to_string()),
        prioridad: Set(payload.prioridad),
        ..Default::default()
    };

    let inserted_request = new_request.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let request_id = inserted_request.id;

    for detail in payload.detalles {
        let new_detail = compras_solicitud_detalle::ActiveModel {
            solicitud_id: Set(request_id),
            repuesto_id: Set(detail.repuesto_id),
            descripcion_item: Set(detail.descripcion_item),
            cantidad: Set(detail.cantidad),
            ..Default::default()
        };
        new_detail.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(inserted_request)))
}

// GET /api/purchases/requests/{id}
pub async fn get_request_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let request = ComprasSolicitudes::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Request not found".to_string()))?;

    let details = ComprasSolicitudDetalle::find()
        .filter(compras_solicitud_detalle::Column::SolicitudId.eq(id))
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

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

// PUT /api/purchases/requests/{id}/status
pub async fn update_request_status(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdatePurchaseRequestStatusDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut request: compras_solicitudes::ActiveModel = ComprasSolicitudes::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Request not found".to_string()))?
        .into();

    request.estado = Set(payload.estado);

    let updated_request = request.update(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

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
    pub impuesto: Option<Decimal>,
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

// POST /api/purchases/orders/from-request/{id}
// This creates a Purchase Order (OrdenCompraRepuesto) from a validated Request
pub async fn create_order_from_request(
    State(db): State<DatabaseConnection>,
    Path(request_id): Path<i32>,
    Json(payload): Json<CreateOrderFromRequestDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
     let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 1. Fetch Request
    let request = ComprasSolicitudes::find_by_id(request_id)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Request not found".to_string()))?;
    
    if request.estado != "APROBADA" {
         return Err((StatusCode::BAD_REQUEST, "Request must be APPROVED to generate an order".to_string()));
    }

    // 2. Create Order Header
    let new_order = orden_compra_repuesto::ActiveModel {
        id_proveedor: Set(Some(payload.proveedor_id)),
        fecha_solicitud: Set(Some(Local::now().date_naive())),
        estado: Set(Some("PENDIENTE".to_string())),
        solicitud_id: Set(Some(request_id)),
        estado_recepcion: Set(Some("PENDIENTE".to_string())),
        ..Default::default()
    };
    
    let inserted_order = new_order.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Fetch Request Details and Create Order Details
    let details = ComprasSolicitudDetalle::find()
        .filter(compras_solicitud_detalle::Column::SolicitudId.eq(request_id))
        .all(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for detail in details {
        if let Some(repuesto_id) = detail.repuesto_id {
            // Only add existing parts to order details for now
             let new_order_detail = orden_compra_detalle::ActiveModel {
                id_orden_compra: Set(inserted_order.id_orden_compra),
                id_repuesto: Set(repuesto_id),
                cantidad: Set(detail.cantidad),
                // cost would be set later or estimates could be fetched
                ..Default::default()
            };
            new_order_detail.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    // 4. Update Request Status to PROCESADA? Or keep APPROVED? 
    // Usually PROCESADA means an order has been generated.
    let mut request_active: compras_solicitudes::ActiveModel = request.into();
    request_active.estado = Set("PROCESADA".to_string());
    request_active.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(inserted_order)))
}

// POST /api/purchases/orders
// Create a direct purchase order without a prior request
pub async fn create_direct_order(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateDirectOrderDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
     let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 1. Generate Sequential Code
    let next_code = crate::utils::code_generator::generate_next_code(&txn, "orden_compra_repuesto", "codigo_compra", "OC-").await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Create Order Header
    let new_order = orden_compra_repuesto::ActiveModel {
        id_proveedor: Set(Some(payload.proveedor_id)),
        fecha_solicitud: Set(Some(Local::now().date_naive())),
        estado: Set(Some("PENDIENTE".to_string())), // Or APROBADA directly? Let's say PENDIENTE until sent
        solicitud_id: Set(None), // No request ID for direct orders
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
    
    let inserted_order = new_order.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 3. Create Order Details
    for item in payload.items {
         let new_order_detail = orden_compra_detalle::ActiveModel {
            id_orden_compra: Set(inserted_order.id_orden_compra),
            id_repuesto: Set(item.repuesto_id),
            cantidad: Set(item.cantidad),
            costo_unitario: Set(Some(item.costo_unitario)),
            // We could store specific tax per item if needed, but schema might not have it yet.
            // For now sticking to schema.
            ..Default::default()
        };
        new_order_detail.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(inserted_order)))
}

// GET /api/purchases/orders/{id}
pub async fn get_order_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let order = OrdenCompraRepuesto::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Order not found".to_string()))?;

    let details = OrdenCompraDetalle::find()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(id))
        .find_also_related(ActivosRepuestos)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let items: Vec<OrderDetailWithPartDto> = details
        .into_iter()
        .map(|(d, p)| OrderDetailWithPartDto {
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

    let dto = OrderWithDetailsDto {
        id_orden_compra: order.id_orden_compra,
        id_proveedor: order.id_proveedor,
        fecha_solicitud: order.fecha_solicitud,
        estado: order.estado,
        total: order.total,
        subtotal: order.subtotal,
        impuestos: order.impuestos,
        codigo_compra: order.codigo_compra,
        fecha_entrega: order.fecha_entrega,
        terminos_pago: order.terminos_pago,
        notas: order.notas,
        items,
    };

    Ok(Json(dto))
}

// PUT /api/purchases/orders/{id}
pub async fn update_order(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateDirectOrderDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut order: orden_compra_repuesto::ActiveModel = OrdenCompraRepuesto::find_by_id(id)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Order not found".to_string()))?
        .into();

    order.id_proveedor = Set(Some(payload.proveedor_id));
    order.fecha_entrega = Set(payload.fecha_entrega);
    order.terminos_pago = Set(payload.terminos_pago);
    order.notas = Set(payload.notas);
    order.subtotal = Set(Some(payload.subtotal));
    order.impuestos = Set(Some(payload.impuestos));
    order.total = Set(Some(payload.total));

    order.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Replace details: delete old and insert new (simple approach)
    OrdenCompraDetalle::delete_many()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(id))
        .exec(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for item in payload.items {
        let new_detail = orden_compra_detalle::ActiveModel {
            id_orden_compra: Set(id),
            id_repuesto: Set(item.repuesto_id),
            cantidad: Set(item.cantidad),
            costo_unitario: Set(Some(item.costo_unitario)),
            ..Default::default()
        };
        new_detail.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}

// PUT /api/purchases/orders/{id}/status
pub async fn update_order_status(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdatePurchaseRequestStatusDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut order: orden_compra_repuesto::ActiveModel = OrdenCompraRepuesto::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Order not found".to_string()))?
        .into();

    order.estado = Set(Some(payload.estado));

    let updated = order.update(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

// DELETE /api/purchases/orders/{id}
pub async fn delete_order(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Delete details first
    OrdenCompraDetalle::delete_many()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(id))
        .exec(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Delete header
    OrdenCompraRepuesto::delete_by_id(id)
        .exec(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

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

// POST /api/purchases/orders/{id}/receive
pub async fn receive_order_items(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<crate::utils::jwt::Claims>,
    Path(order_id): Path<i32>,
    Json(payload): Json<ReceiveOrderDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 1. Fetch Order
    let mut order: orden_compra_repuesto::ActiveModel = OrdenCompraRepuesto::find_by_id(order_id)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Order not found".to_string()))?
        .into();

    let mut some_items_received = false;

    // 2. Process Items
    for item in payload.items {
        if item.cantidad_recibir <= 0 { continue; }

        let mut detail: orden_compra_detalle::ActiveModel = OrdenCompraDetalle::find_by_id(item.id_detalle)
            .one(&txn)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, format!("Detail {} not found", item.id_detalle)))?
            .into();

        let current_received = detail.cantidad_recibida.clone().unwrap();
        let ordered = detail.cantidad.clone().unwrap();
        
        if current_received + item.cantidad_recibir > ordered {
             return Err((StatusCode::BAD_REQUEST, format!("Cannot receive more than ordered for detail {}", item.id_detalle)));
        }

        // Update Detail - set new value
        detail.cantidad_recibida = Set(current_received + item.cantidad_recibir);
        
        // Extract repuesto_id BEFORE update consumes detail
        let repuesto_id = detail.id_repuesto.clone().unwrap();

        // Save detail update
        detail.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        // Update Inventory (ActivosRepuestos)
        
        // Update Inventory (ActivosRepuestos) - Atomic Update to prevent race conditions
        use sea_orm::{sea_query::Expr, DbBackend};
        
        let mut update_query = activos_repuestos::Entity::update_many()
            .col_expr(
                activos_repuestos::Column::StockActual,
                Expr::col(activos_repuestos::Column::StockActual).add(item.cantidad_recibir)
            )
            .filter(activos_repuestos::Column::IdRepuesto.eq(repuesto_id));

        // Update location if provided
        if let Some(bid) = item.bodega_id {
            update_query = update_query.col_expr(activos_repuestos::Column::BodegaId, Expr::val(bid).into());
        }
        if let Some(ubid) = item.ubicacion_bodega_id {
            update_query = update_query.col_expr(activos_repuestos::Column::UbicacionBodegaId, Expr::val(ubid).into());
        }

        update_query.exec(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        // Log Movement in inventario_movimientos
        let movement = inventario_movimientos::ActiveModel {
            repuesto_id: Set(repuesto_id),
            tipo: Set("ENTRADA_COMPRA".to_string()),
            cantidad: Set(item.cantidad_recibir),
            referencia_id: Set(Some(order_id)),
            fecha: Set(Some(Local::now().into())), // DateTimeWithTimeZone
            usuario_id: Set(claims.user_id),
            ..Default::default()
        };
        movement.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
        some_items_received = true;
    }

    // 3. Check Status
    let details = OrdenCompraDetalle::find()
        .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(order_id))
        .all(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut fully_received = true;
    for d in details {
        if d.cantidad_recibida < d.cantidad {
            fully_received = false;
            break;
        }
    }

    if fully_received {
        order.estado_recepcion = Set(Some("COMPLETA".to_string()));
         order.estado = Set(Some("RECIBIDA".to_string())); // Optional: Close the order
    } else if some_items_received {
        order.estado_recepcion = Set(Some("PARCIAL".to_string()));
    }

    order.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}
