use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QuerySelect, RelationTrait, JoinType};
use serde::{Deserialize, Serialize};
use crate::entities::{orden_compra_repuesto, orden_compra_detalle, activos_repuestos};
use sea_orm::prelude::Decimal;
use std::str::FromStr;

#[derive(Deserialize)]
pub struct CreatePurchaseOrderRequest {
    pub id_ot: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub codigo_compra: Option<String>,
    pub detalles: Vec<PurchaseDetailRequest>,
}

#[derive(Deserialize)]
pub struct PurchaseDetailRequest {
    pub id_repuesto: i32,
    pub cantidad: i32,
    pub costo_unitario: f64,
}

pub async fn create_purchase_order(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreatePurchaseOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Transaction ideally
    let new_order = orden_compra_repuesto::ActiveModel {
        id_ot: Set(payload.id_ot),
        id_proveedor: Set(payload.id_proveedor),
        codigo_compra: Set(payload.codigo_compra),
        estado: Set(Some("solicitado".to_string())),
        ..Default::default()
    };

    let order = new_order.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for det in payload.detalles {
        let new_det = orden_compra_detalle::ActiveModel {
            id_orden_compra: Set(order.id_orden_compra),
            id_repuesto: Set(det.id_repuesto),
            cantidad: Set(det.cantidad),
            costo_unitario: Set(Some(Decimal::from_str(&det.costo_unitario.to_string()).unwrap_or_default())),
            ..Default::default()
        };
        new_det.insert(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(Json(order.id_orden_compra))
}

pub async fn get_purchases(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let purchases = orden_compra_repuesto::Entity::find()
        .find_with_related(orden_compra_detalle::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Transform to a friendlier structure if needed, or return as is (SeaORM returns (Model, Vec<RelatedModel>))
    // We'll return it as is and handle in frontend or create a DTO. 
    // To return tuples as JSON with SeaORM entities, we might need a custom struct or rely on serde magic if implemented.
    // SeaORM's `find_with_related` returns `Vec<(ParentModel, Vec<ChildModel>)>`. 
    // We need to ensure both models implement Serialize. `orden_compra_repuesto` does. `orden_compra_detalle` does.
    // Serde serializes tuples as arrays by default. We might want a DTO for cleaner JSON.
    
    // Quick DTO approach for clarity
    let result: Vec<serde_json::Value> = purchases.into_iter().map(|(order, details)| {
        serde_json::json!({
            "order": order,
            "details": details
        })
    }).collect();

    Ok(Json(result))
}
