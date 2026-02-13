use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, TransactionTrait, QueryOrder, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{compras_cotizaciones, compras_cotizacion_detalle, activos_repuestos, proveedores};
use crate::utils::mailer;
use base64::{Engine as _, engine::general_purpose};

#[derive(Deserialize)]
pub struct QuoteDetailRequest {
    pub repuesto_id: i32,
    pub cantidad: i32,
}

#[derive(Deserialize)]
pub struct QuoteRequest {
    pub proveedor_id: i32,
    pub fecha_solicitud: chrono::NaiveDate,
    pub codigo: String,
    pub observaciones: Option<String>,
    pub detalles: Vec<QuoteDetailRequest>,
}

// ...

#[derive(Serialize)]
pub struct QuoteDetailDto {
    pub id: i32,
    pub cotizacion_id: i32,
    pub repuesto_id: i32,
    pub nombre_repuesto: Option<String>,
    pub cantidad: i32,
}

#[derive(Serialize)]
pub struct QuoteDto {
    pub id: i32,
    pub proveedor_id: i32,
    pub nombre_proveedor: Option<String>,
    pub fecha_solicitud: chrono::NaiveDate,
    pub codigo: String,
    pub estado: String,
    pub observaciones: Option<String>,
    pub detalles: Vec<QuoteDetailDto>,
}

pub async fn get_quotes(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let quotes = compras_cotizaciones::Entity::find()
        .find_also_related(proveedores::Entity)
        .order_by_desc(compras_cotizaciones::Column::Id)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Fetch details for all quotes efficiently
    let quote_ids: Vec<i32> = quotes.iter().map(|(q, _)| q.id).collect();
    
    let details = compras_cotizacion_detalle::Entity::find()
        .filter(compras_cotizacion_detalle::Column::CotizacionId.is_in(quote_ids))
        .find_also_related(activos_repuestos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Group details by quote ID
    use std::collections::HashMap;
    let mut details_map: HashMap<i32, Vec<QuoteDetailDto>> = HashMap::new();
    
    for (d, r) in details {
        let dto = QuoteDetailDto {
            id: d.id,
            cotizacion_id: d.cotizacion_id,
            repuesto_id: d.repuesto_id,
            nombre_repuesto: r.map(|x| x.nombre_repuesto),
            cantidad: d.cantidad,
        };
        details_map.entry(d.cotizacion_id).or_default().push(dto);
    }

    let mut dtos = Vec::new();
    for (q, p) in quotes {
        let quote_details = details_map.remove(&q.id).unwrap_or_default();
        
        dtos.push(QuoteDto {
            id: q.id,
            proveedor_id: q.proveedor_id,
            nombre_proveedor: p.map(|x| x.nombre_proveedor),
            fecha_solicitud: q.fecha_solicitud,
            codigo: q.codigo,
            estado: q.estado,
            observaciones: q.observaciones,
            detalles: quote_details,
        });
    }

    Ok(Json(dtos))
}

pub async fn get_quote_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let quote = compras_cotizaciones::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Quote not found".to_string()))?;

    let prov = proveedores::Entity::find_by_id(quote.proveedor_id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let details = compras_cotizacion_detalle::Entity::find()
        .filter(compras_cotizacion_detalle::Column::CotizacionId.eq(id))
        .find_also_related(activos_repuestos::Entity)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let detail_dtos = details.into_iter().map(|(d, r)| QuoteDetailDto {
        id: d.id,
        cotizacion_id: d.cotizacion_id,
        repuesto_id: d.repuesto_id,
        nombre_repuesto: r.map(|x| x.nombre_repuesto),
        cantidad: d.cantidad,
    }).collect();

    Ok(Json(QuoteDto {
        id: quote.id,
        proveedor_id: quote.proveedor_id,
        nombre_proveedor: prov.map(|x| x.nombre_proveedor),
        fecha_solicitud: quote.fecha_solicitud,
        codigo: quote.codigo,
        estado: quote.estado,
        observaciones: quote.observaciones,
        detalles: detail_dtos,
    }))
}

pub async fn create_quote(
    State(db): State<DatabaseConnection>,
    Extension(_claims): axum::Extension<crate::utils::jwt::Claims>,
    Json(payload): Json<QuoteRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let new_quote = compras_cotizaciones::ActiveModel {
        proveedor_id: Set(payload.proveedor_id),
        fecha_solicitud: Set(payload.fecha_solicitud),
        codigo: Set(payload.codigo),
        estado: Set("BORRADOR".to_string()),
        observaciones: Set(payload.observaciones),
        ..Default::default()
    };

    let quote = new_quote.insert(&txn).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for item in payload.detalles {
        let new_detail = compras_cotizacion_detalle::ActiveModel {
            cotizacion_id: Set(quote.id),
            repuesto_id: Set(item.repuesto_id),
            cantidad: Set(item.cantidad),
            ..Default::default()
        };
        new_detail.insert(&txn).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(quote.id)))
}

pub async fn update_quote(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<QuoteRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let txn = db.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let quote = compras_cotizaciones::Entity::find_by_id(id)
        .one(&txn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Quote not found".to_string()))?;

    if quote.estado != "BORRADOR" {
        return Err((StatusCode::BAD_REQUEST, "Cannot edit sent quote".to_string()));
    }

    let mut active: compras_cotizaciones::ActiveModel = quote.into();
    active.proveedor_id = Set(payload.proveedor_id);
    active.fecha_solicitud = Set(payload.fecha_solicitud);
    active.codigo = Set(payload.codigo);
    active.observaciones = Set(payload.observaciones);
    active.update(&txn).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Replace details
    compras_cotizacion_detalle::Entity::delete_many()
        .filter(compras_cotizacion_detalle::Column::CotizacionId.eq(id))
        .exec(&txn)
        .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for item in payload.detalles {
        let new_detail = compras_cotizacion_detalle::ActiveModel {
            cotizacion_id: Set(id),
            repuesto_id: Set(item.repuesto_id),
            cantidad: Set(item.cantidad),
            ..Default::default()
        };
        new_detail.insert(&txn).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    txn.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}

pub async fn delete_quote(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Delete details cascade? Schema says cascade delete on detail relation foreign key to quote?
    // Let's check migration. Yes, on_delete(ForeignKeyAction::Cascade).
    // But manual delete is safer or just delete header.
    
    let res = compras_cotizaciones::Entity::delete_by_id(id)
        .exec(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if res.rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Quote not found".to_string()));
    }

    Ok(StatusCode::OK)
}

#[derive(Deserialize)]
pub struct SendEmailRequest {
    pub email: Option<String>,
    pub pdf_base64: String, // Base64 encoded PDF
}

pub async fn send_quote_email(
    State(db): State<DatabaseConnection>,
    Extension(_claims): axum::Extension<crate::utils::jwt::Claims>,
    Path(id): Path<i32>,
    Json(payload): Json<SendEmailRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let quote = compras_cotizaciones::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Quote not found".to_string()))?;

    // Determine target email
    let mut target_emails: Vec<String> = if let Some(e) = payload.email {
        e.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
    } else {
        let prov = proveedores::Entity::find_by_id(quote.proveedor_id)
            .one(&db)
            .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .ok_or((StatusCode::NOT_FOUND, "Provider not found".to_string()))?;
        let email = prov.email.ok_or((StatusCode::BAD_REQUEST, "Provider has no email and none provided".to_string()))?;
        vec![email]
    };

    // Add sender CC
    let user = crate::entities::usuarios::Entity::find_by_id(_claims.user_id)
        .one(&db)
        .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "User not found".to_string()))?;
    
    if !target_emails.contains(&user.email) {
        target_emails.push(user.email);
    }

    let final_to = target_emails.join(",");

    // Decode PDF
    let pdf_data = general_purpose::STANDARD
        .decode(&payload.pdf_base64)
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid Base64: {}", e)))?;

    // Send Email
    let subject = format!("Solicitud de Cotización {}", quote.codigo);
    let body = format!(
        "Estimado proveedor,<br><br>Adjunto encontrará la solicitud de cotización {}.<br><br>Saludos,<br>Hotel A",
        quote.codigo
    );

    mailer::send_email_with_attachment(
        &db,
        &final_to,
        &subject,
        &body,
        "cotizacion.pdf",
        pdf_data,
        "application/pdf"
    ).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    // Update status to ENVIADA
    let mut active: compras_cotizaciones::ActiveModel = quote.into();
    active.estado = Set("ENVIADA".to_string());
    active.update(&db).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Email sent successfully".to_string()))
}
