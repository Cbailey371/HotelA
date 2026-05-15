use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait};
use serde::{Deserialize, Serialize};
use crate::entities::proveedores;

#[derive(Deserialize)]
pub struct ProviderRequest {
    pub nombre_proveedor: String,
    pub tipo_proveedor: Option<String>,
    pub contacto_nombre: Option<String>,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub direccion: Option<String>,
    pub pais: Option<String>,
    pub estado: Option<String>,
    pub codigo_proveedor: Option<String>,
    pub rut_o_ruc: Option<String>,
    pub ciudad: Option<String>,
    pub sitio_web: Option<String>,
    pub metodos_pago_aceptados: Option<String>,
    pub observaciones: Option<String>,
    pub dv: Option<String>,
}

#[derive(Serialize)]
pub struct ProviderDto {
    pub id: i32,
    pub nombre: String,
    pub tipo: Option<String>,
    pub contacto: Option<String>,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub direccion: Option<String>,
    pub estado: Option<String>,
    pub codigo: Option<String>,
    pub rut_o_ruc: Option<String>,
    pub ciudad: Option<String>,
    pub sitio_web: Option<String>,
    pub metodos_pago_aceptados: Option<String>,
    pub observaciones: Option<String>,
    pub dv: Option<String>,
}

pub async fn get_providers(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    use sea_orm::QueryOrder;
    let providers = proveedores::Entity::find()
        .order_by_asc(proveedores::Column::IdProveedor)
        .all(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let dtos: Vec<ProviderDto> = providers.into_iter().map(|p| ProviderDto {
        id: p.id_proveedor,
        nombre: p.nombre_proveedor,
        tipo: p.tipo_proveedor,
        contacto: p.contacto_nombre,
        telefono: p.telefono,
        email: p.email,
        direccion: p.direccion,
        estado: p.estado,

        codigo: p.codigo_proveedor,
        rut_o_ruc: p.rut_o_ruc,
        ciudad: p.ciudad,
        sitio_web: p.sitio_web,
        metodos_pago_aceptados: p.metodos_pago_aceptados,
        observaciones: p.observaciones,
        dv: p.dv,
    }).collect();

    Ok(Json(dtos))
}

pub async fn create_provider(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<ProviderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Determine the provider code
    let final_code = if let Some(ref code) = payload.codigo_proveedor {
        if !code.trim().is_empty() {
            code.clone()
        } else {
            crate::utils::code_generator::generate_next_code(&db, "proveedores", "codigo_proveedor", "PRO-").await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        }
    } else {
        crate::utils::code_generator::generate_next_code(&db, "proveedores", "codigo_proveedor", "PRO-").await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    };

    let new_provider = proveedores::ActiveModel {
        nombre_proveedor: Set(payload.nombre_proveedor),
        tipo_proveedor: Set(payload.tipo_proveedor),
        contacto_nombre: Set(payload.contacto_nombre),
        telefono: Set(payload.telefono),
        email: Set(payload.email),
        direccion: Set(payload.direccion),
        pais: Set(payload.pais),
        estado: Set(payload.estado.or(Some("activo".to_string()))),

        codigo_proveedor: Set(Some(final_code)),
        rut_o_ruc: Set(payload.rut_o_ruc),
        ciudad: Set(payload.ciudad),
        sitio_web: Set(payload.sitio_web),
        metodos_pago_aceptados: Set(payload.metodos_pago_aceptados),
        observaciones: Set(payload.observaciones),
        dv: Set(payload.dv),
        ..Default::default()
    };

    let p = new_provider.insert(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ProviderDto {
        id: p.id_proveedor,
        nombre: p.nombre_proveedor,
        tipo: p.tipo_proveedor,
        contacto: p.contacto_nombre,
        telefono: p.telefono,
        email: p.email,
        direccion: p.direccion,
        estado: p.estado,

        codigo: p.codigo_proveedor,
        rut_o_ruc: p.rut_o_ruc,
        ciudad: p.ciudad,
        sitio_web: p.sitio_web,
        metodos_pago_aceptados: p.metodos_pago_aceptados,
        observaciones: p.observaciones,
        dv: p.dv,
    }))
}

pub async fn update_provider(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<ProviderRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut provider: proveedores::ActiveModel = proveedores::Entity::find_by_id(id)
        .one(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Provider not found".to_string()))?
        .into();

    provider.nombre_proveedor = Set(payload.nombre_proveedor);
    provider.tipo_proveedor = Set(payload.tipo_proveedor);
    provider.contacto_nombre = Set(payload.contacto_nombre);
    provider.telefono = Set(payload.telefono);
    provider.email = Set(payload.email);
    provider.direccion = Set(payload.direccion);
    provider.pais = Set(payload.pais);
    provider.estado = Set(payload.estado);
    provider.codigo_proveedor = Set(payload.codigo_proveedor);
    provider.rut_o_ruc = Set(payload.rut_o_ruc);
    provider.ciudad = Set(payload.ciudad);
    provider.sitio_web = Set(payload.sitio_web);
    provider.metodos_pago_aceptados = Set(payload.metodos_pago_aceptados);
    provider.observaciones = Set(payload.observaciones);
    provider.dv = Set(payload.dv);

    let updated = provider.update(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ProviderDto {
        id: updated.id_proveedor,
        nombre: updated.nombre_proveedor,
        tipo: updated.tipo_proveedor,
        contacto: updated.contacto_nombre,
        telefono: updated.telefono,
        email: updated.email,
        direccion: updated.direccion,
        estado: updated.estado,

        codigo: updated.codigo_proveedor,
        rut_o_ruc: updated.rut_o_ruc,
        ciudad: updated.ciudad,
        sitio_web: updated.sitio_web,
        metodos_pago_aceptados: updated.metodos_pago_aceptados,
        observaciones: updated.observaciones,
        dv: updated.dv,
    }))
}

pub async fn delete_provider(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let provider = proveedores::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Provider not found".to_string()))?;

    proveedores::Entity::delete_by_id(id).exec(&db).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        
    Ok(Json("Provider deleted".to_string()))
}

}
