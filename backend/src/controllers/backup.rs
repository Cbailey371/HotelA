use axum::{
    Json,
    extract::State,
    response::IntoResponse,
    http::header,
};
use axum_extra::extract::Multipart;
use sea_orm::{DatabaseConnection, EntityTrait, ActiveModelTrait, TransactionTrait};
use serde::{Deserialize, Serialize};
use crate::entities::{activos_equipos, activos_repuestos, proveedores, tecnicos};
use crate::utils::error::AppError;

#[derive(Serialize, Deserialize)]
pub struct BackupData {
    pub activos: Vec<activos_equipos::Model>,
    pub inventario: Vec<activos_repuestos::Model>,
    pub proveedores: Vec<proveedores::Model>,
    pub tecnicos: Vec<tecnicos::Model>,
    // Timestamp ISO string
    pub fecha_respaldo: String,
}

pub async fn export_backup(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let activos = activos_equipos::Entity::find().all(&db).await?;
    let inventario = activos_repuestos::Entity::find().all(&db).await?;
    let proveedores = proveedores::Entity::find().all(&db).await?;
    let tecnicos = tecnicos::Entity::find().all(&db).await?;

    let backup = BackupData {
        activos,
        inventario,
        proveedores,
        tecnicos,
        fecha_respaldo: chrono::Local::now().to_rfc3339(),
    };

    let json_data = serde_json::to_string_pretty(&backup)
        .map_err(|e| AppError::Internal(format!("Error serializing backup: {}", e)))?;

    let filename = format!("backup_hotela_{}.json", chrono::Local::now().format("%Y%m%d_%H%M%S"));
    let content_disposition = format!("attachment; filename=\"{}\"", filename);

    let headers = [
        (header::CONTENT_TYPE, "application/json".to_string()),
        (header::CONTENT_DISPOSITION, content_disposition),
    ];

    Ok((headers, json_data))
}

pub async fn import_backup(
    State(db): State<DatabaseConnection>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let mut json_content = String::new();
    
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "backup_file" {
            let bytes = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            json_content = String::from_utf8(bytes.to_vec())
                .map_err(|_| AppError::BadRequest("Invalid UTF-8 file".to_string()))?;
            break;
        }
    }

    if json_content.is_empty() {
        return Err(AppError::BadRequest("No backup file provided".to_string()));
    }

    let backup: BackupData = serde_json::from_str(&json_content)
        .map_err(|e| AppError::BadRequest(format!("Invalid backup format: {}", e)))?;

    let txn = db.begin().await?;

    for item in backup.proveedores {
        let mut active_model: proveedores::ActiveModel = item.into();
        let exists = proveedores::Entity::find_by_id(active_model.id_proveedor.clone().unwrap())
            .one(&txn)
            .await?;

        if exists.is_some() {
             active_model.id_proveedor = sea_orm::ActiveValue::Unchanged(active_model.id_proveedor.clone().unwrap());
             active_model.update(&txn).await?;
        } else {
             active_model.insert(&txn).await?;
        }
    }

    for item in backup.tecnicos {
        let mut active_model: tecnicos::ActiveModel = item.into();
        let id = active_model.id_tecnico.clone().unwrap();
        let exists = tecnicos::Entity::find_by_id(id).one(&txn).await?;
        if exists.is_some() {
            active_model.id_tecnico = sea_orm::ActiveValue::Unchanged(id);
            active_model.update(&txn).await?;
        } else {
            active_model.insert(&txn).await?;
        }
    }

    for item in backup.inventario {
        let mut active_model: activos_repuestos::ActiveModel = item.into();
        let id = active_model.id_repuesto.clone().unwrap();
        let exists = activos_repuestos::Entity::find_by_id(id).one(&txn).await?;
        if exists.is_some() {
            active_model.id_repuesto = sea_orm::ActiveValue::Unchanged(id);
            active_model.update(&txn).await?;
        } else {
            active_model.insert(&txn).await?;
        }
    }

    for item in backup.activos {
        let mut active_model: activos_equipos::ActiveModel = item.into();
        let id = active_model.id_equipo.clone().unwrap();
        let exists = activos_equipos::Entity::find_by_id(id).one(&txn).await?;
        if exists.is_some() {
            active_model.id_equipo = sea_orm::ActiveValue::Unchanged(id);
            active_model.update(&txn).await?;
        } else {
            active_model.insert(&txn).await?;
        }
    }

    txn.commit().await?;
    Ok(Json("Restauración completada con éxito. Datos actualizados."))
}
