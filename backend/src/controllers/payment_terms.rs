use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use serde::{Deserialize, Serialize};
use crate::entities::terminos_pago;
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryOrder};
use crate::utils::{jwt, audit};

#[derive(Deserialize)]
pub struct CreatePaymentTermRequest {
    pub nombre: String,
    pub dias: i32,
}

#[derive(Serialize)]
pub struct PaymentTermDto {
    pub id: i32,
    pub nombre: String,
    pub dias: i32,
}

pub async fn get_payment_terms(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let items = terminos_pago::Entity::find()
        .order_by_asc(terminos_pago::Column::Nombre)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<PaymentTermDto> = items.into_iter().map(|i| PaymentTermDto {
        id: i.id,
        nombre: i.nombre,
        dias: i.dias,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_payment_term(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreatePaymentTermRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let new_item = terminos_pago::ActiveModel {
        nombre: Set(payload.nombre.clone()),
        dias: Set(payload.dias),
        ..Default::default()
    };

    let saved = new_item.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "terminos_pago", 
        Some(saved.id), 
        Some(format!("Creado término de pago: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(PaymentTermDto {
        id: saved.id,
        nombre: saved.nombre,
        dias: saved.dias,
    }))
}

pub async fn update_payment_term(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreatePaymentTermRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let item = terminos_pago::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Payment term not found".to_string()))?;

    let mut item: terminos_pago::ActiveModel = item.into();
    item.nombre = Set(payload.nombre.clone());
    item.dias = Set(payload.dias);

    let updated = item.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "UPDATE", 
        "terminos_pago", 
        Some(updated.id), 
        Some(format!("Actualizado término pago: {}", payload.nombre)),
        None
    ).await;

    Ok(Json(PaymentTermDto {
        id: updated.id,
        nombre: updated.nombre,
        dias: updated.dias,
    }))
}

pub async fn delete_payment_term(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let result = terminos_pago::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Payment term not found".to_string()));
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "DELETE", 
        "terminos_pago", 
        Some(id), 
        Some("Eliminado término de pago".to_string()),
        None
    ).await;

    Ok(Json("Payment term deleted".to_string()))
}
