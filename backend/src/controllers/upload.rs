use axum::{
    response::IntoResponse,
    Json,
};
use axum_extra::extract::Multipart;
use serde_json::json;
use std::path::Path;
use tokio::fs;
use uuid::Uuid;
use crate::utils::error::AppError;

pub async fn upload_image(mut multipart: Multipart) -> Result<impl IntoResponse, AppError> {
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        let name = field.name().unwrap_or("file").to_string();
        
        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown").to_string();
            let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
            let data = field.bytes().await.map_err(|e| AppError::Internal(e.to_string()))?;

            // Basic validation
             if !content_type.starts_with("image/") {
                return Err(AppError::BadRequest("Solo se permiten imágenes".to_string()));
            }

            let ext = Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("png");
            // Security: normalize extension
            let safe_ext = match ext.to_lowercase().as_str() {
                "jpg" | "jpeg" | "png" | "webp" => ext,
                _ => "png",
            };

            let new_filename = format!("{}.{}", Uuid::new_v4(), safe_ext);
            let upload_path = format!("uploads/{}", new_filename);

            fs::write(&upload_path, data).await
                .map_err(|e| AppError::Internal(format!("Failed to save file: {}", e)))?;

            return Ok(Json(json!({
                "url": format!("/uploads/{}", new_filename),
                "original_name": file_name
            })));
        }
    }

    Err(AppError::BadRequest("No file provided".to_string()))
}

pub async fn upload_manual(mut multipart: Multipart) -> Result<impl IntoResponse, AppError> {
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        let name = field.name().unwrap_or("file").to_string();
        
        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown").to_string();
            let data = field.bytes().await.map_err(|e| AppError::Internal(e.to_string()))?;

            let ext = Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("pdf");
            
            // Security: whitelist extensions for manuals
            let safe_ext = match ext.to_lowercase().as_str() {
                "pdf" | "doc" | "docx" | "xls" | "xlsx" | "txt" => ext.to_lowercase(),
                _ => return Err(AppError::BadRequest("Formato de manual no permitido".to_string())),
            };

            let new_filename = format!("manual_{}.{}", Uuid::new_v4(), safe_ext);
            let upload_path = format!("uploads/{}", new_filename);

            fs::write(&upload_path, data).await
                .map_err(|e| AppError::Internal(format!("Failed to save manual: {}", e)))?;

            return Ok(Json(json!({
                "url": format!("/uploads/{}", new_filename),
                "original_name": file_name
            })));
        }
    }

    Err(AppError::BadRequest("No file provided".to_string()))
}
