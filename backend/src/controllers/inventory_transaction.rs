use sea_orm::*;
use crate::entities::{prelude::*, *};
use chrono::prelude::*;
use axum::{Json, extract::State, response::IntoResponse};
use crate::utils::error::AppError;

pub async fn get_transactions(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let txns = inventario_movimientos::Entity::find()
        .order_by_desc(inventario_movimientos::Column::Fecha)
        .all(&db)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Json(txns))
}

// Helper function to create an inventory movement record
pub async fn log_movement(
    txn: &DatabaseTransaction,
    repuesto_id: i32,
    tipo: &str,
    cantidad: i32,
    referencia_id: Option<i32>,
    usuario_id: i32,
) -> Result<(), DbErr> {
    let movement = inventario_movimientos::ActiveModel {
        repuesto_id: Set(repuesto_id),
        tipo: Set(tipo.to_string()),
        cantidad: Set(cantidad),
        referencia_id: Set(referencia_id),
        fecha: Set(Some(Local::now().fixed_offset())),
        usuario_id: Set(usuario_id),
        ..Default::default()
    };
    movement.insert(txn).await?;
    Ok(())
}

// reserve_stock
pub async fn reserve_stock(
    txn: &DatabaseTransaction,
    repuesto_id: i32,
    cantidad: i32,
    referencia_id: i32, // ID Maintenance
    usuario_id: i32,
) -> Result<(), DbErr> {
    let item_model = ActivosRepuestos::find_by_id(repuesto_id)
        .one(txn)
        .await?
        .ok_or(DbErr::Custom("Part not found".to_owned()))?;

    let current_reserved = item_model.stock_reservado;
    let current_stock = item_model.stock_actual.unwrap_or(0);
    
    if (current_stock - current_reserved) < cantidad {
         return Err(DbErr::Custom("Insufficient available stock to reserve".to_owned()));
    }

    let mut item: activos_repuestos::ActiveModel = item_model.into();
    item.stock_reservado = Set(current_reserved + cantidad);
    item.update(txn).await?;

    log_movement(txn, repuesto_id, "RESERVA", cantidad, Some(referencia_id), usuario_id).await?;

    Ok(())
}

// consume_reserved_stock
pub async fn consume_reserved_stock(
    txn: &DatabaseTransaction,
    repuesto_id: i32,
    cantidad: i32,
    referencia_id: i32, // ID Maintenance
    usuario_id: i32,
) -> Result<(), DbErr> {
    let item_model = ActivosRepuestos::find_by_id(repuesto_id)
        .one(txn)
        .await?
        .ok_or(DbErr::Custom("Part not found".to_owned()))?;

    let current_reserved = item_model.stock_reservado;
    let current_stock = item_model.stock_actual.unwrap_or(0);

    let mut item: activos_repuestos::ActiveModel = item_model.into();
    
    item.stock_actual = Set(Some(current_stock - cantidad));
    item.stock_reservado = Set(std::cmp::max(0, current_reserved - cantidad));
    
    item.update(txn).await?;

    log_movement(txn, repuesto_id, "SALIDA_MANTENIMIENTO", cantidad, Some(referencia_id), usuario_id).await?;

    Ok(())
}

// release_reservation
pub async fn release_reservation(
    txn: &DatabaseTransaction,
    repuesto_id: i32,
    cantidad: i32,
    referencia_id: i32,
    usuario_id: i32,
) -> Result<(), DbErr> {
    let item_model = ActivosRepuestos::find_by_id(repuesto_id)
        .one(txn)
        .await?
        .ok_or(DbErr::Custom("Part not found".to_owned()))?;

    let current_reserved = item_model.stock_reservado;
    
    let mut item: activos_repuestos::ActiveModel = item_model.into();
    item.stock_reservado = Set(std::cmp::max(0, current_reserved - cantidad));
    item.update(txn).await?;

    log_movement(txn, repuesto_id, "LIBERACION_RESERVA", cantidad, Some(referencia_id), usuario_id).await?;

    Ok(())
}

// add_stock
pub async fn add_stock(
    txn: &DatabaseTransaction,
    repuesto_id: i32,
    cantidad: i32,
    referencia_id: i32, // ID Order
    usuario_id: i32,
) -> Result<(), DbErr> {
     let item_model = ActivosRepuestos::find_by_id(repuesto_id)
        .one(txn)
        .await?
        .ok_or(DbErr::Custom("Part not found".to_owned()))?;

    let current_stock = item_model.stock_actual.unwrap_or(0);
    
    let mut item: activos_repuestos::ActiveModel = item_model.into();
    item.stock_actual = Set(Some(current_stock + cantidad));
    item.update(txn).await?;

    log_movement(txn, repuesto_id, "ENTRADA_COMPRA", cantidad, Some(referencia_id), usuario_id).await?;

    Ok(())
}
