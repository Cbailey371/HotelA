use axum::{Json, extract::{State}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{configuraciones, config_empresa};
use crate::utils::mailer;

#[derive(Serialize, Deserialize)]
pub struct SmtpSettingsDto {
    pub smtp_host: String,
    pub smtp_port: String,
    pub smtp_user: String,
    pub smtp_password: String, // We send it back? Maybe masked or empty if not changed.
    pub smtp_from_email: String,
}

#[derive(Deserialize)]
pub struct TestEmailRequest {
    pub to: String,
}

pub async fn get_smtp_settings(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let settings = configuraciones::Entity::find().all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let get_val = |key: &str| -> String {
        settings.iter().find(|s| s.clave == key).map(|s| s.valor.clone()).unwrap_or_default()
    };

    let dto = SmtpSettingsDto {
        smtp_host: get_val("smtp_host"),
        smtp_port: get_val("smtp_port"),
        smtp_user: get_val("smtp_user"),
        smtp_password: get_val("smtp_password"), // Security Warning: Sending plain text password. For MVP only.
        smtp_from_email: get_val("smtp_from_email"),
    };

    Ok(Json(dto))
}

pub async fn save_smtp_settings(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<SmtpSettingsDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Helper to upsert
    let upsert = |key: &str, val: &str| {
        let key = key.to_string();
        let val = val.to_string();
        let db = db.clone();
        async move {
            let existing = configuraciones::Entity::find()
                .filter(configuraciones::Column::Clave.eq(&key))
                .one(&db).await?;
            
            if let Some(model) = existing {
                let mut active: configuraciones::ActiveModel = model.into();
                active.valor = Set(val);
                active.update(&db).await?;
            } else {
                let active = configuraciones::ActiveModel {
                    clave: Set(key),
                    valor: Set(val),
                    ..Default::default()
                };
                active.insert(&db).await?;
            }
            Ok::<_, sea_orm::DbErr>(())
        }
    };

    upsert("smtp_host", &payload.smtp_host).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    upsert("smtp_port", &payload.smtp_port).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    upsert("smtp_user", &payload.smtp_user).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    // Only update password if not empty (to allow 'don't change' logic if we implemented masking)
    // But here frontend sends everything.
    upsert("smtp_password", &payload.smtp_password).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    upsert("smtp_from_email", &payload.smtp_from_email).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json("Configuración guardada"))
}

pub async fn test_smtp_connection(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<TestEmailRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    mailer::send_email(&db, &payload.to, "Prueba de SMTP HotelA", "Si recibes este correo, la configuración SMTP es correcta.").await
        .map_err(|e| (StatusCode::BAD_REQUEST, e))?;

    Ok(Json("Email de prueba enviado"))
}

#[derive(Serialize, Deserialize)]
pub struct CompanySettingsDto {
    pub logo: Option<String>,
    pub nombre_comercial: String,
    pub razon_social: String,
    pub ruc: String,
    pub dv: String,
    pub telefono: String,
    pub correo: String,
    pub direccion: String,
    pub ciudad: String,
}

pub async fn get_company_settings(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let settings = config_empresa::Entity::find().one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(settings))
}

pub async fn save_company_settings(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CompanySettingsDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let existing = config_empresa::Entity::find().one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(model) = existing {
        let mut active: config_empresa::ActiveModel = model.into();
        active.logo = Set(payload.logo);
        active.nombre_comercial = Set(payload.nombre_comercial);
        active.razon_social = Set(payload.razon_social);
        active.ruc = Set(payload.ruc);
        active.dv = Set(payload.dv);
        active.telefono = Set(payload.telefono);
        active.correo = Set(payload.correo);
        active.direccion = Set(payload.direccion);
        active.ciudad = Set(payload.ciudad);
        active.update(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    } else {
        let active = config_empresa::ActiveModel {
            logo: Set(payload.logo),
            nombre_comercial: Set(payload.nombre_comercial),
            razon_social: Set(payload.razon_social),
            ruc: Set(payload.ruc),
            dv: Set(payload.dv),
            telefono: Set(payload.telefono),
            correo: Set(payload.correo),
            direccion: Set(payload.direccion),
            ciudad: Set(payload.ciudad),
            ..Default::default()
        };
        active.insert(&db).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(Json("Configuración de empresa guardada"))
}
