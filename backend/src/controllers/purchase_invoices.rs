use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, TransactionTrait, QueryOrder, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{facturas_compras, facturas_compras_detalle, activos_repuestos, orden_compra_detalle, orden_compra_repuesto, inventario_movimientos};
use sea_orm::prelude::Decimal;

#[derive(Deserialize)]
pub struct ReceiveInvoiceItemRequest {
    pub id_detalle: i32,
    pub cantidad_recibir: i32,
    pub bodega_id: Option<i32>,
    pub ubicacion_bodega_id: Option<i32>,
}

#[derive(Deserialize)]
pub struct ReceiveInvoiceRequest {
    pub items: Vec<ReceiveInvoiceItemRequest>,
}

#[derive(Deserialize)]
pub struct InvoiceDetailRequest {
    pub id_repuesto: i32,
    pub id_detalle_oc: Option<i32>,
    pub cantidad: i32,
    pub costo_unitario: Decimal,
    pub bodega_id: Option<i32>,
    pub ubicacion_bodega_id: Option<i32>,
}

#[derive(Deserialize)]
pub struct InvoiceRequest {
    pub id_orden_compra: Option<i32>,
    pub id_proveedor: i32,
    pub numero_factura: String,
    pub fecha_emision: chrono::NaiveDate,
    pub subtotal: Decimal,
    pub impuestos: Decimal,
    pub total: Decimal,
    pub notas: Option<String>,
    pub detalles: Vec<InvoiceDetailRequest>,
}

#[derive(Serialize)]
pub struct InvoiceDto {
    pub id: i32,
    pub id_orden_compra: Option<i32>,
    pub id_proveedor: i32,
    pub nombre_proveedor: Option<String>,
    pub numero_factura: String,
    pub fecha_emision: chrono::NaiveDate,
    pub fecha_recepcion: Option<chrono::NaiveDate>,
    pub subtotal: Decimal,
    pub impuestos: Decimal,
    pub total: Decimal,
    pub estado: String,
    pub notas: Option<String>,
}

pub async fn get_invoices(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let invoices = facturas_compras::Entity::find()
        .find_also_related(crate::entities::proveedores::Entity)
        .order_by_desc(facturas_compras::Column::Id)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<InvoiceDto> = invoices.into_iter().map(|(f, p)| InvoiceDto {
        id: f.id,
        id_orden_compra: f.id_orden_compra,
        id_proveedor: f.id_proveedor,
        nombre_proveedor: p.map(|x| x.nombre_proveedor),
        numero_factura: f.numero_factura,
        fecha_emision: f.fecha_emision,
        fecha_recepcion: f.fecha_recepcion,
        subtotal: f.subtotal,
        impuestos: f.impuestos,
        total: f.total,
        estado: f.estado,
        notas: f.notas,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_invoice(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<InvoiceRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Determine initial status based on integrated reception
    let all_received = payload.detalles.iter().all(|d| d.bodega_id.is_some());
    let some_received = payload.detalles.iter().any(|d| d.bodega_id.is_some());
    
    let estado = if all_received && !payload.detalles.is_empty() { "RECIBIDA" } else { "PENDIENTE" };
    let fecha_recepcion = if some_received { Some(chrono::Local::now().naive_local().date()) } else { None };

    let new_invoice = facturas_compras::ActiveModel {
        id_orden_compra: Set(payload.id_orden_compra),
        id_proveedor: Set(payload.id_proveedor),
        numero_factura: Set(payload.numero_factura),
        fecha_emision: Set(payload.fecha_emision),
        fecha_recepcion: Set(fecha_recepcion),
        subtotal: Set(payload.subtotal),
        impuestos: Set(payload.impuestos),
        total: Set(payload.total),
        estado: Set(estado.to_string()),
        notas: Set(payload.notas),
        ..Default::default()
    };

    let invoice = new_invoice.insert(&txn).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for detail in payload.detalles {
        let new_detail = facturas_compras_detalle::ActiveModel {
            id_factura: Set(invoice.id),
            id_repuesto: Set(detail.id_repuesto),
            id_detalle_oc: Set(detail.id_detalle_oc),
            cantidad: Set(detail.cantidad),
            costo_unitario: Set(detail.costo_unitario),
            ..Default::default()
        };
        new_detail.insert(&txn).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        // Integrated Reception: If bodega is provided during invoice creation, update stock immediately
        if let Some(bodega_id) = detail.bodega_id {
            // 1. Update Inventory Stock
            let mut part: activos_repuestos::ActiveModel = activos_repuestos::Entity::find_by_id(detail.id_repuesto)
                .one(&txn)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
                .ok_or((StatusCode::NOT_FOUND, format!("Part {} not found", detail.id_repuesto)))?
                .into();

            let current_stock = part.stock_actual.as_ref().clone().unwrap_or(0);
            part.stock_actual = Set(Some(current_stock + detail.cantidad));
            
            part.bodega_id = Set(Some(bodega_id));
            if let Some(ubid) = detail.ubicacion_bodega_id {
                part.ubicacion_bodega_id = Set(Some(ubid));
            }
            
            part.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            // 2. Update OC Detalle (if exists)
            if let Some(id_oc_det) = detail.id_detalle_oc {
                let mut oc_detail: orden_compra_detalle::ActiveModel = orden_compra_detalle::Entity::find_by_id(id_oc_det)
                    .one(&txn)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
                    .ok_or((StatusCode::NOT_FOUND, format!("OC Detail {} not found", id_oc_det)))?
                    .into();

                let prev_received = oc_detail.cantidad_recibida.as_ref();
                oc_detail.cantidad_recibida = Set(prev_received + detail.cantidad);
                oc_detail.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }

            // 3. Register Movement
            let movement = inventario_movimientos::ActiveModel {
                repuesto_id: Set(detail.id_repuesto),
                tipo: Set("ENTRADA_FACTURA".to_string()),
                cantidad: Set(detail.cantidad),
                referencia_id: Set(Some(invoice.id)),
                usuario_id: Set(0), 
                ..Default::default()
            };
            movement.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    // 4. Sync OC Status (if exists)
    if let Some(oc_id) = payload.id_orden_compra {
        let details = orden_compra_detalle::Entity::find()
            .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(oc_id))
            .all(&txn)
            .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let mut fully_received = true;
        let mut some_received = false;
        for d in details {
            if d.cantidad_recibida < d.cantidad {
                fully_received = false;
            }
            if d.cantidad_recibida > 0 {
                some_received = true;
            }
        }

        let mut oc: orden_compra_repuesto::ActiveModel = orden_compra_repuesto::Entity::find_by_id(oc_id)
            .one(&txn)
            .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, "OC not found".to_string()))?
            .into();

        if fully_received {
            oc.estado_recepcion = Set(Some("COMPLETA".to_string()));
            oc.estado = Set(Some("RECIBIDA".to_string()));
        } else if some_received {
            oc.estado_recepcion = Set(Some("PARCIAL".to_string()));
        } else {
            oc.estado_recepcion = Set(Some("PENDIENTE".to_string()));
        }

        oc.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(InvoiceDto {
        id: invoice.id,
        id_orden_compra: invoice.id_orden_compra,
        id_proveedor: invoice.id_proveedor,
        nombre_proveedor: None,
        numero_factura: invoice.numero_factura,
        fecha_emision: invoice.fecha_emision,
        fecha_recepcion: invoice.fecha_recepcion,
        subtotal: invoice.subtotal,
        impuestos: invoice.impuestos,
        total: invoice.total,
        estado: invoice.estado,
        notas: invoice.notas,
    }))
}

pub async fn receive_invoice(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<ReceiveInvoiceRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let invoice = facturas_compras::Entity::find_by_id(id)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Invoice not found".to_string()))?;

    if invoice.estado == "RECIBIDA" {
        return Err((StatusCode::BAD_REQUEST, "Invoice already received".to_string()));
    }

    for item_req in payload.items {
        if item_req.cantidad_recibir <= 0 { continue; }

        let detail = facturas_compras_detalle::Entity::find_by_id(item_req.id_detalle)
            .one(&txn)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, format!("Invoice detail {} not found", item_req.id_detalle)))?;

        // 1. Update Inventory Stock
        let mut part: activos_repuestos::ActiveModel = activos_repuestos::Entity::find_by_id(detail.id_repuesto)
            .one(&txn)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, format!("Part {} not found", detail.id_repuesto)))?
            .into();

        let current_stock = part.stock_actual.as_ref().clone().unwrap_or(0);
        part.stock_actual = Set(Some(current_stock + item_req.cantidad_recibir));
        
        if let Some(bid) = item_req.bodega_id {
            part.bodega_id = Set(Some(bid));
        }
        if let Some(ubid) = item_req.ubicacion_bodega_id {
            part.ubicacion_bodega_id = Set(Some(ubid));
        }
        
        part.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        // 2. Update OC Detalle (received quantity) if linked
        if let Some(oc_det_id) = detail.id_detalle_oc {
            let mut oc_detail: orden_compra_detalle::ActiveModel = orden_compra_detalle::Entity::find_by_id(oc_det_id)
                .one(&txn)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
                .ok_or((StatusCode::NOT_FOUND, format!("OC Detail {} not found", oc_det_id)))?
                .into();

            let prev_received = oc_detail.cantidad_recibida.as_ref().clone();
            oc_detail.cantidad_recibida = Set(prev_received + item_req.cantidad_recibir);
            oc_detail.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }

        // 3. Register Movement
        let movement = inventario_movimientos::ActiveModel {
            repuesto_id: Set(detail.id_repuesto),
            tipo: Set("ENTRADA_FACTURA".to_string()),
            cantidad: Set(item_req.cantidad_recibir),
            referencia_id: Set(Some(detail.id_factura)),
            usuario_id: Set(0), 
            ..Default::default()
        };
        movement.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    let mut invoice_active: facturas_compras::ActiveModel = invoice.clone().into();
    invoice_active.estado = Set("RECIBIDA".to_string());
    invoice_active.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 4. Sync OC Status (if invoice is linked to an OC)
    if let Some(oc_id) = invoice.id_orden_compra.as_ref() {
        let oc_id = *oc_id;
        let details = orden_compra_detalle::Entity::find()
            .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(oc_id))
            .all(&txn)
            .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let mut fully_received = true;
        let mut some_received = false;
        for d in details {
            if d.cantidad_recibida < d.cantidad {
                fully_received = false;
            }
            if d.cantidad_recibida > 0 {
                some_received = true;
            }
        }

        let mut oc: orden_compra_repuesto::ActiveModel = orden_compra_repuesto::Entity::find_by_id(oc_id)
            .one(&txn)
            .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, "OC not found".to_string()))?
            .into();

        if fully_received {
            oc.estado_recepcion = Set(Some("COMPLETA".to_string()));
            oc.estado = Set(Some("RECIBIDA".to_string()));
        } else if some_received {
            oc.estado_recepcion = Set(Some("PARCIAL".to_string()));
        } else {
            oc.estado_recepcion = Set(Some("PENDIENTE".to_string()));
        }

        oc.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Invoice received and stock updated".to_string()))
}

#[derive(Serialize)]
pub struct InvoiceDetailDto {
    pub id: i32,
    pub id_factura: i32,
    pub id_repuesto: i32,
    pub nombre_repuesto: Option<String>,
    pub id_detalle_oc: Option<i32>,
    pub cantidad: i32,
    pub costo_unitario: Decimal,
}

#[derive(Serialize)]
pub struct InvoiceWithDetailsDto {
    pub id: i32,
    pub id_orden_compra: Option<i32>,
    pub id_proveedor: i32,
    pub nombre_proveedor: Option<String>,
    pub numero_factura: String,
    pub fecha_emision: chrono::NaiveDate,
    pub fecha_recepcion: Option<chrono::NaiveDate>,
    pub subtotal: Decimal,
    pub impuestos: Decimal,
    pub total: Decimal,
    pub estado: String,
    pub notas: Option<String>,
    pub detalles: Vec<InvoiceDetailDto>,
}

pub async fn get_invoice_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let invoice = facturas_compras::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Invoice not found".to_string()))?;

    let details: Vec<(facturas_compras_detalle::Model, Option<activos_repuestos::Model>)> = facturas_compras_detalle::Entity::find()
        .filter(facturas_compras_detalle::Column::IdFactura.eq(id))
        .find_also_related(activos_repuestos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let detalles_dto: Vec<InvoiceDetailDto> = details.into_iter().map(|(d, p)| InvoiceDetailDto {
        id: d.id,
        id_factura: d.id_factura,
        id_repuesto: d.id_repuesto,
        nombre_repuesto: p.map(|x| x.nombre_repuesto),
        id_detalle_oc: d.id_detalle_oc,
        cantidad: d.cantidad,
        costo_unitario: d.costo_unitario,
    }).collect();

    let prov = crate::entities::proveedores::Entity::find_by_id(invoice.id_proveedor)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dto = InvoiceWithDetailsDto {
        id: invoice.id,
        id_orden_compra: invoice.id_orden_compra,
        id_proveedor: invoice.id_proveedor,
        nombre_proveedor: prov.map(|x| x.nombre_proveedor),
        numero_factura: invoice.numero_factura,
        fecha_emision: invoice.fecha_emision,
        fecha_recepcion: invoice.fecha_recepcion,
        subtotal: invoice.subtotal,
        impuestos: invoice.impuestos,
        total: invoice.total,
        estado: invoice.estado,
        notas: invoice.notas,
        detalles: detalles_dto,
    };

    Ok(Json(dto))
}

#[derive(Deserialize)]
pub struct UpdateInvoiceRequest {
    pub numero_factura: Option<String>,
    pub fecha_emision: Option<chrono::NaiveDate>,
    pub notas: Option<String>,
}

pub async fn update_invoice(
    State(db): State<DatabaseConnection>,
    Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateInvoiceRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    if claims.role != "SUPER-ADMIN" {
        return Err((StatusCode::FORBIDDEN, "Requires SUPER-ADMIN role".to_string()));
    }

    let invoice = facturas_compras::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Invoice not found".to_string()))?;

    if invoice.estado != "PENDIENTE" && claims.role != "SUPER-ADMIN" {
        return Err((StatusCode::BAD_REQUEST, "Only PENDING invoices can be updated".to_string()));
    }

    let mut invoice_active: facturas_compras::ActiveModel = invoice.into();
    
    if let Some(num) = payload.numero_factura {
        invoice_active.numero_factura = Set(num);
    }
    if let Some(date) = payload.fecha_emision {
        invoice_active.fecha_emision = Set(date);
    }
    if let Some(notas) = payload.notas {
        invoice_active.notas = Set(Some(notas));
    }

    invoice_active.update(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}

pub async fn delete_invoice(
    State(db): State<DatabaseConnection>,
    Extension(claims): axum::Extension<crate::utils::jwt::Claims>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    if claims.role != "SUPER-ADMIN" {
        return Err((StatusCode::FORBIDDEN, "Requires SUPER-ADMIN role".to_string()));
    }

    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let invoice = facturas_compras::Entity::find_by_id(id)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Invoice not found".to_string()))?;

    if invoice.estado == "RECIBIDA" {
        // REVERSION LOGIC
        let details = facturas_compras_detalle::Entity::find()
            .filter(facturas_compras_detalle::Column::IdFactura.eq(id))
            .all(&txn)
            .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        for detail in details {
             // 1. Revert Inventory Stock
            let mut part: activos_repuestos::ActiveModel = activos_repuestos::Entity::find_by_id(detail.id_repuesto)
                .one(&txn)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
                .ok_or((StatusCode::NOT_FOUND, format!("Part {} not found", detail.id_repuesto)))?
                .into();

            let current_stock = part.stock_actual.as_ref().clone().unwrap_or(0);
            if current_stock < detail.cantidad {
                 return Err((StatusCode::BAD_REQUEST, format!("Cannot revert: Insufficient stock for part {}", detail.id_repuesto)));
            }
            part.stock_actual = Set(Some(current_stock - detail.cantidad));
            part.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            // 2. Revert OC Detalle (received quantity) if linked
            if let Some(oc_det_id) = detail.id_detalle_oc {
                 let mut oc_detail: orden_compra_detalle::ActiveModel = orden_compra_detalle::Entity::find_by_id(oc_det_id)
                    .one(&txn)
                    .await
                    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
                    .ok_or((StatusCode::NOT_FOUND, format!("OC Detail {} not found", oc_det_id)))?
                    .into();

                let prev_received = oc_detail.cantidad_recibida.as_ref().clone();
                // Ensure we don't go below zero
                let new_received = if prev_received >= detail.cantidad { prev_received - detail.cantidad } else { 0 };
                
                oc_detail.cantidad_recibida = Set(new_received);
                oc_detail.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }

            // 3. Register Annulment Movement
            let movement = inventario_movimientos::ActiveModel {
                repuesto_id: Set(detail.id_repuesto),
                tipo: Set("ANULACION_FACTURA".to_string()),
                cantidad: Set(-detail.cantidad), // Negative for output
                referencia_id: Set(Some(invoice.id)),
                usuario_id: Set(claims.user_id), 
                ..Default::default()
            };
            movement.insert(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }

        // 4. Re-Evaluate OC Status
        if let Some(oc_id) = invoice.id_orden_compra {
            let details = orden_compra_detalle::Entity::find()
                .filter(orden_compra_detalle::Column::IdOrdenCompra.eq(oc_id))
                .all(&txn)
                .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            let mut fully_received = true;
            let mut some_received = false;
            for d in details {
                if d.cantidad_recibida < d.cantidad {
                    fully_received = false;
                }
                if d.cantidad_recibida > 0 {
                    some_received = true;
                }
            }

            let mut oc: orden_compra_repuesto::ActiveModel = orden_compra_repuesto::Entity::find_by_id(oc_id)
                .one(&txn)
                .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
                .ok_or((StatusCode::NOT_FOUND, "OC not found".to_string()))?
                .into();

            if fully_received {
                oc.estado_recepcion = Set(Some("COMPLETA".to_string()));
                oc.estado = Set(Some("RECIBIDA".to_string()));
            } else if some_received {
                oc.estado_recepcion = Set(Some("PARCIAL".to_string()));
                oc.estado = Set(Some("RECIBIDA".to_string())); // Still received/partial
            } else {
                oc.estado_recepcion = Set(Some("PENDIENTE".to_string()));
                 // If absolutely nothing received, maybe go back to PENDING or stay RECIBIDA? 
                 // Usually if an OC has no receipts, it is PENDING.
                 oc.estado = Set(Some("PENDIENTE".to_string()));
            }

            oc.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    // Finally delete the invoice details and header
    facturas_compras_detalle::Entity::delete_many()
        .filter(facturas_compras_detalle::Column::IdFactura.eq(id))
        .exec(&txn)
        .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    facturas_compras::Entity::delete_by_id(id)
        .exec(&txn)
        .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}

