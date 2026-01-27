use axum::{
    response::IntoResponse,
    Json, http::StatusCode,
};
use axum_extra::extract::Multipart;
use serde_json::json;
use std::path::Path;
use tokio::fs;
use uuid::Uuid;

pub async fn upload_image(mut multipart: Multipart) -> Result<impl IntoResponse, (StatusCode, String)> {
    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        let name = field.name().unwrap_or("file").to_string();
        
        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown").to_string();
            let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
            let data = field.bytes().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            // Basic validation
             if !content_type.starts_with("image/") {
                return Err((StatusCode::BAD_REQUEST, "Solo se permiten imágenes".to_string()));
            }

            let ext = Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("png");
            let new_filename = format!("{}.{}", Uuid::new_v4(), ext);
            let upload_path = format!("uploads/{}", new_filename);

            fs::write(&upload_path, data).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)))?;

            return Ok(Json(json!({
                "url": format!("/uploads/{}", new_filename),
                "original_name": file_name
            })));
        }
    }

    Err((StatusCode::BAD_REQUEST, "No file provided".to_string()))
}
pub async fn upload_manual(mut multipart: Multipart) -> Result<impl IntoResponse, (StatusCode, String)> {
    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        let name = field.name().unwrap_or("file").to_string();
        
        if name == "file" {
            let file_name = field.file_name().unwrap_or("unknown").to_string();
            let data = field.bytes().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            // No strict MIME validation for manuals as per user request ("cualquier formato")
            // but we could still check extensions if we wanted to be safer.
            
            let ext = Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("pdf");
            let new_filename = format!("manual_{}.{}", Uuid::new_v4(), ext);
            let upload_path = format!("uploads/{}", new_filename);

            fs::write(&upload_path, data).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save manual: {}", e)))?;

            return Ok(Json(json!({
                "url": format!("/uploads/{}", new_filename),
                "original_name": file_name
            })));
        }
    }

    Err((StatusCode::BAD_REQUEST, "No file provided".to_string()))
}
