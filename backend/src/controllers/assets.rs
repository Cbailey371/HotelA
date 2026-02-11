use axum::{Json, extract::{State, Path}, response::IntoResponse, http::StatusCode, Extension};
use axum_extra::extract::Multipart;
use serde::{Deserialize, Serialize};
use crate::entities::{activos_equipos, mantenimiento_historial, historial_repuestos, activos_repuestos, tecnicos, activos_documentos};
use sea_orm::{DatabaseConnection, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, ModelTrait, RelationTrait, QueryOrder};
use crate::utils::{jwt, audit, code_generator::generate_next_code, error::AppError};

#[derive(Deserialize)]
pub struct CreateAssetRequest {
    // pub codigo_equipo: String, // This is technically unused in create as we generate it, but frontend sends it? Frontend sends empty now.
    // Actually wait, let's keep one.
    pub codigo_equipo: Option<String>, // Making it Option since backend generates it? Or Keep String if frontend sends dummy.
    pub codigo_administrativo: Option<String>,
    pub nombre_equipo: String,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub ubicacion: Option<String>,
    pub area_responsable: Option<String>,
    pub estado: Option<String>,
    pub imagen_url: Option<String>,
    pub tipo_activo: Option<String>,
    pub anio: Option<i32>,
    pub color: Option<String>,
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub manual_pdf: Option<String>,
    pub cantidad: Option<i32>,
    pub ubicacion_detallada: Option<String>,
    pub fecha_instalacion: Option<String>,
    pub fecha_adquisicion: Option<String>,
    pub documentos: Option<Vec<AddDocumentRequest>>,
}

#[derive(Deserialize)]
pub struct UpdateAssetRequest {
    pub codigo_administrativo: Option<String>,
    pub nombre_equipo: Option<String>,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub ubicacion: Option<String>,
    pub area_responsable: Option<String>,
    pub estado: Option<String>,
    pub imagen_url: Option<String>,
    pub tipo_activo: Option<String>,
    pub anio: Option<i32>,
    pub color: Option<String>,
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub manual_pdf: Option<String>,
    pub cantidad: Option<i32>,
    pub ubicacion_detallada: Option<String>,
    pub fecha_instalacion: Option<String>,
    pub fecha_adquisicion: Option<String>,
    pub documentos: Option<Vec<AddDocumentRequest>>,
}

#[derive(Serialize)]
pub struct AssetDto {
    pub id: i32,
    pub codigo: String,
    pub codigo_administrativo: Option<String>,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub categoria: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub serie: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: Option<String>,
    pub imagen_url: Option<String>,
    pub tipo_activo: Option<String>,
    pub anio: Option<i32>,
    pub color: Option<String>,
    pub numero_motor: Option<String>,
    pub numero_chasis: Option<String>,
    pub manual_pdf: Option<String>,
    pub cantidad: Option<i32>,
    pub ubicacion_detallada: Option<String>,
    pub fecha_instalacion: Option<String>,
    pub fecha_adquisicion: Option<String>,
    pub historial: Vec<MaintenanceHistoryItem>,
    pub repuestos: Vec<SparePartHistoryItem>,
    pub documentos: Vec<DocumentoDto>,
    pub proximo_servicio: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DocumentoDto {
    pub id: i32,
    pub nombre_archivo: String,
    pub url_archivo: String,
    pub created_at: Option<String>,
}

#[derive(Deserialize)]
pub struct AddDocumentRequest {
    pub nombre_archivo: String,
    pub url_archivo: String,
}

#[derive(Serialize)]
pub struct MaintenanceHistoryItem {
    pub id: i32,
    pub fecha: String,
    pub tecnico: String,
    pub tarea: String,
    pub observaciones: Option<String>,
}

#[derive(Serialize)]
pub struct SparePartHistoryItem {
    pub id: i32,
    pub nombre: String,
    pub cantidad: i32,
    pub fecha: String,
}

pub async fn create_asset(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<CreateAssetRequest>,
) -> Result<impl IntoResponse, AppError> {
    let codigo_equipo = generate_next_code(&db, "activos_equipos", "codigo_equipo", "ACT-").await?;

    let new_asset = activos_equipos::ActiveModel {
        codigo_equipo: Set(codigo_equipo),
        codigo_administrativo: Set(payload.codigo_administrativo),
        nombre_equipo: Set(payload.nombre_equipo.clone()),
        descripcion: Set(payload.descripcion),
        categoria: Set(payload.categoria),
        marca: Set(payload.marca),
        modelo: Set(payload.modelo),
        numero_serie: Set(payload.numero_serie),
        ubicacion: Set(payload.ubicacion),
        area_responsable: Set(payload.area_responsable),
        estado: Set(payload.estado.or(Some("activo".to_string()))),
        imagen_url: Set(payload.imagen_url),
        tipo_activo: Set(payload.tipo_activo),
        anio: Set(payload.anio),
        color: Set(payload.color),
        numero_motor: Set(payload.numero_motor),
        numero_chasis: Set(payload.numero_chasis),
        manual_pdf: Set(payload.manual_pdf),
        cantidad: Set(payload.cantidad),
        ubicacion_detallada: Set(payload.ubicacion_detallada),
        fecha_instalacion: Set(payload.fecha_instalacion.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())),
        fecha_adquisicion: Set(payload.fecha_adquisicion.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())),
        ..Default::default()
    };

    let asset = new_asset.insert(&db).await?;

    // Insert documents if any
    if let Some(docs) = payload.documentos {
        for doc_req in docs {
            let new_doc = activos_documentos::ActiveModel {
                activo_id: Set(asset.id_equipo),
                nombre_archivo: Set(doc_req.nombre_archivo),
                url_archivo: Set(doc_req.url_archivo),
                ..Default::default()
            };
            new_doc.insert(&db).await?;
        }
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "CREATE", 
        "activos_equipos", 
        Some(asset.id_equipo), 
        Some(format!("Creado activo: {}", payload.nombre_equipo)),
        None
    ).await;

    // Fetch documents to return in DTO
    let documentos = crate::entities::activos_documentos::Entity::find()
        .filter(crate::entities::activos_documentos::Column::ActivoId.eq(asset.id_equipo))
        .all(&db)
        .await?;

    Ok(Json(map_asset_to_dto_full(asset, vec![], vec![], documentos, None)))
}

fn map_asset_to_dto(a: activos_equipos::Model, historial: Vec<MaintenanceHistoryItem>, repuestos: Vec<SparePartHistoryItem>) -> AssetDto {
    AssetDto {
        id: a.id_equipo,
        codigo: a.codigo_equipo,
        codigo_administrativo: a.codigo_administrativo,
        nombre: a.nombre_equipo,
        descripcion: a.descripcion,
        categoria: a.categoria,
        marca: a.marca,
        modelo: a.modelo,
        serie: a.numero_serie,
        ubicacion: a.ubicacion,
        estado: a.estado,
        imagen_url: a.imagen_url,
        tipo_activo: a.tipo_activo,
        anio: a.anio,
        color: a.color,
        numero_motor: a.numero_motor,
        numero_chasis: a.numero_chasis,
        manual_pdf: a.manual_pdf,
        cantidad: a.cantidad,
        ubicacion_detallada: a.ubicacion_detallada,
        fecha_instalacion: a.fecha_instalacion.map(|d| d.to_string()),
        fecha_adquisicion: a.fecha_adquisicion.map(|d| d.to_string()),
        historial,
        repuestos,
        documentos: vec![],
        proximo_servicio: None,
    }
}

fn map_asset_to_dto_full(
    a: activos_equipos::Model, 
    historial: Vec<MaintenanceHistoryItem>, 
    repuestos: Vec<SparePartHistoryItem>,
    documentos: Vec<activos_documentos::Model>,
    proximo_servicio: Option<String>
) -> AssetDto {
    AssetDto {
        id: a.id_equipo,
        codigo: a.codigo_equipo,
        codigo_administrativo: a.codigo_administrativo,
        nombre: a.nombre_equipo,
        descripcion: a.descripcion,
        categoria: a.categoria,
        marca: a.marca,
        modelo: a.modelo,
        serie: a.numero_serie,
        ubicacion: a.ubicacion,
        estado: a.estado,
        imagen_url: a.imagen_url,
        tipo_activo: a.tipo_activo,
        anio: a.anio,
        color: a.color,
        numero_motor: a.numero_motor,
        numero_chasis: a.numero_chasis,
        manual_pdf: a.manual_pdf,
        cantidad: a.cantidad,
        ubicacion_detallada: a.ubicacion_detallada,
        fecha_instalacion: a.fecha_instalacion.map(|d| d.to_string()),
        fecha_adquisicion: a.fecha_adquisicion.map(|d| d.to_string()),
        historial,
        repuestos,
        documentos: documentos.into_iter().map(|d| DocumentoDto {
            id: d.id,
            nombre_archivo: d.nombre_archivo,
            url_archivo: d.url_archivo,
            created_at: d.created_at.map(|dt| dt.to_rfc3339()),
        }).collect(),
        proximo_servicio,
    }
}

pub async fn get_assets(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    let assets = activos_equipos::Entity::find()
        .filter(activos_equipos::Column::Estado.ne("baja"))
        .order_by_asc(activos_equipos::Column::IdEquipo)
        .all(&db)
        .await?;

    let dtos: Vec<AssetDto> = assets.into_iter().map(|a| map_asset_to_dto(a, vec![], vec![])).collect();

    Ok(Json(dtos))
}

pub async fn get_asset_by_id(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!("Fetching asset by id: {}", id);
    let asset = activos_equipos::Entity::find_by_id(id)
        .one(&db)
        .await
        .map_err(|e| {
            tracing::error!("Error finding asset: {}", e);
            AppError::Internal(e.to_string())
        })?
        .ok_or_else(|| AppError::NotFound("Activo no encontrado".to_string()))?;

    tracing::info!("Asset found, fetching maintenance history");

    let history_items = mantenimiento_historial::Entity::find()
        .filter(mantenimiento_historial::Column::EquipoId.eq(id))
        .find_also_related(tecnicos::Entity)
        .all(&db)
        .await?;

    tracing::info!("Maintenance history fetched (count: {}), fetching spare parts", history_items.len());

    let historial = history_items.into_iter().map(|(h, t)| MaintenanceHistoryItem {
        id: h.id_mantenimiento,
        fecha: h.fecha_ejecucion.map(|d| d.to_string()).unwrap_or_default(),
        tecnico: t.map(|v| format!("{} {}", v.nombre, v.apellido)).unwrap_or("N/A".to_string()),
        tarea: h.observaciones.clone().unwrap_or_default(),
        observaciones: h.observaciones,
    }).collect();

    let spare_items = historial_repuestos::Entity::find()
        .filter(historial_repuestos::Column::EquipoId.eq(id))
        .find_also_related(activos_repuestos::Entity)
        .all(&db)
        .await?;

    tracing::info!("Spare parts history fetched (count: {}), fetching documents", spare_items.len());

    let repuestos = spare_items.into_iter().map(|(h, r)| SparePartHistoryItem {
        id: h.id_historial_repuesto,
        nombre: r.map(|v| v.nombre_repuesto).unwrap_or("Desconocido".to_string()),
        cantidad: h.cantidad_utilizada.unwrap_or(0),
        fecha: h.fecha_uso.map(|d| d.to_string()).unwrap_or_default(),
    }).collect();

    let documentos = activos_documentos::Entity::find()
        .filter(activos_documentos::Column::ActivoId.eq(id))
        .all(&db)
        .await?;
        
    // Fetch Next Scheduled Maintenance
    use crate::entities::mantenimiento_calendario;
    use sea_orm::QueryOrder;
    
    let next_maintenance = mantenimiento_calendario::Entity::find()
        .filter(mantenimiento_calendario::Column::EquipoId.eq(id))
        .filter(mantenimiento_calendario::Column::Estado.eq("programado"))
        .order_by_asc(mantenimiento_calendario::Column::FechaProgramada)
        .one(&db)
        .await?;
        
    let proximo_servicio = next_maintenance.and_then(|m| m.fecha_programada.map(|d| d.to_string()));

    tracing::info!("Documents fetched (count: {}), mapping to DTO", documentos.len());

    Ok(Json(map_asset_to_dto_full(asset, historial, repuestos, documentos, proximo_servicio)))
}

pub async fn update_asset(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateAssetRequest>,
) -> Result<impl IntoResponse, AppError> {
    let mut asset: activos_equipos::ActiveModel = activos_equipos::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Activo no encontrado".to_string()))?
        .into();

    if let Some(v) = payload.codigo_administrativo { asset.codigo_administrativo = Set(Some(v)); }
    if let Some(v) = payload.nombre_equipo { asset.nombre_equipo = Set(v); }
    if let Some(v) = payload.descripcion { asset.descripcion = Set(Some(v)); }
    if let Some(v) = payload.categoria { asset.categoria = Set(Some(v)); }
    if let Some(v) = payload.marca { asset.marca = Set(Some(v)); }
    if let Some(v) = payload.modelo { asset.modelo = Set(Some(v)); }
    if let Some(v) = payload.numero_serie { asset.numero_serie = Set(Some(v)); }
    if let Some(v) = payload.ubicacion { asset.ubicacion = Set(Some(v)); }
    if let Some(v) = payload.area_responsable { asset.area_responsable = Set(Some(v)); }
    // Field-level permission check for critical fields (Status in Assets)
    let has_critical_perm = crate::middleware::auth::check_permission(&db, claims.user_id, "critical_fields_edit").await;

    if let Some(v) = payload.estado { 
        if !has_critical_perm {
            let existing = activos_equipos::Entity::find_by_id(id).one(&db).await?.unwrap();
            if existing.estado != Some(v.clone()) {
                return Err(AppError::Forbidden("No tiene permisos para modificar el estado del activo".to_string()));
            }
        }
        asset.estado = Set(Some(v)); 
    }
    if let Some(v) = payload.imagen_url { asset.imagen_url = Set(Some(v)); }

    if let Some(v) = payload.tipo_activo { asset.tipo_activo = Set(Some(v)); }
    if let Some(v) = payload.anio { asset.anio = Set(Some(v)); }
    if let Some(v) = payload.color { asset.color = Set(Some(v)); }
    if let Some(v) = payload.numero_motor { asset.numero_motor = Set(Some(v)); }
    if let Some(v) = payload.numero_chasis { asset.numero_chasis = Set(Some(v)); }
    if let Some(v) = payload.manual_pdf { asset.manual_pdf = Set(Some(v)); }
    if let Some(v) = payload.cantidad { asset.cantidad = Set(Some(v)); }
    if let Some(v) = payload.ubicacion_detallada { asset.ubicacion_detallada = Set(Some(v)); }
    if let Some(v) = payload.fecha_instalacion { asset.fecha_instalacion = Set(chrono::NaiveDate::parse_from_str(&v, "%Y-%m-%d").ok()); }
    if let Some(v) = payload.fecha_adquisicion { asset.fecha_adquisicion = Set(chrono::NaiveDate::parse_from_str(&v, "%Y-%m-%d").ok()); }

    let updated = asset.update(&db).await?;

    let documentos = activos_documentos::Entity::find()
        .filter(activos_documentos::Column::ActivoId.eq(id))
        .all(&db)
        .await?;

    Ok(Json(map_asset_to_dto_full(updated, vec![], vec![], documentos, None)))
}

pub async fn delete_asset(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Extension(claims): Extension<jwt::Claims>,
) -> Result<impl IntoResponse, AppError> {
    let mut asset: activos_equipos::ActiveModel = activos_equipos::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Activo no encontrado".to_string()))?
        .into();

    asset.estado = Set(Some("baja".to_string()));
    let asset_nombre = asset.nombre_equipo.clone().unwrap();

    asset.update(&db).await?;

    audit::log_action(
        &db, 
        claims.user_id, 
        "DELETE_SOFT", 
        "activos_equipos", 
        Some(id), 
        Some(format!("Dado de baja activo: {}", asset_nombre)),
        None
    ).await;

    Ok(Json("Asset deleted (soft)".to_string()))
}

pub async fn import_assets_csv(
    State(db): State<DatabaseConnection>,
    Extension(claims): Extension<jwt::Claims>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let mut count = 0;
    
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        if field.name() == Some("file") {
            let data = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            let mut reader = csv::Reader::from_reader(&data[..]);
            
            for result in reader.deserialize() {
                let record: CreateAssetRequest = result.map_err(|e| AppError::BadRequest(format!("CSV format error: {}", e)))?;
                
                // Buscar si existe por código para actualizar, o crear
                // Buscar si existe por código para actualizar, o crear
                let codigo_equipo = record.codigo_equipo.clone().ok_or_else(|| AppError::BadRequest("Código de equipo es requerido".to_string()))?;

                let existing = activos_equipos::Entity::find()
                    .filter(activos_equipos::Column::CodigoEquipo.eq(codigo_equipo.clone()))
                    .one(&db)
                    .await?;

                let mut active_model = if let Some(asset) = existing {
                    asset.into()
                } else {
                    activos_equipos::ActiveModel {
                        codigo_equipo: Set(codigo_equipo),
                        ..Default::default()
                    }
                };

                active_model.nombre_equipo = Set(record.nombre_equipo);
                active_model.descripcion = Set(record.descripcion);
                active_model.categoria = Set(record.categoria);
                active_model.marca = Set(record.marca);
                active_model.modelo = Set(record.modelo);
                active_model.numero_serie = Set(record.numero_serie);
                active_model.ubicacion = Set(record.ubicacion);
                active_model.area_responsable = Set(record.area_responsable);
                active_model.estado = Set(record.estado.or(Some("activo".to_string())));
                active_model.imagen_url = Set(record.imagen_url);
                active_model.tipo_activo = Set(record.tipo_activo);
                active_model.anio = Set(record.anio);
                active_model.color = Set(record.color);
                active_model.numero_motor = Set(record.numero_motor);
                active_model.numero_chasis = Set(record.numero_chasis);
                active_model.manual_pdf = Set(record.manual_pdf);
                active_model.cantidad = Set(record.cantidad);
                active_model.ubicacion_detallada = Set(record.ubicacion_detallada);
                active_model.fecha_instalacion = Set(record.fecha_instalacion.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()));
                active_model.fecha_adquisicion = Set(record.fecha_adquisicion.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()));

                if active_model.id_equipo.is_set() {
                    active_model.update(&db).await?;
                } else {
                    active_model.insert(&db).await?;
                }
                count += 1;
            }
        }
    }

    audit::log_action(
        &db, 
        claims.user_id, 
        "IMPORT", 
        "activos_equipos", 
        None, 
        Some(format!("Importados {} activos vía CSV", count)),
        None
    ).await;

    Ok(Json(format!("Successfully imported {} assets", count)))
}

pub async fn get_assets_template() -> impl IntoResponse {
    let csv_content = "\
codigo_equipo,nombre_equipo,descripcion,categoria,marca,modelo,numero_serie,ubicacion,area_responsable,estado,imagen_url,tipo_activo,anio,color,numero_motor,numero_chasis,manual_pdf,cantidad,ubicacion_detallada,fecha_instalacion,fecha_adquisicion
AIR-001,Aire Acondicionado Central,Unidad de 5 toneladas,Climatización,Carrier,XJ-100,SN12345678,Piso 1,Mantenimiento,activo,,Equipo,2023,Blanco,,,651,1,Sala de Máquinas,2023-01-15,2023-01-10
GEN-001,Generador Eléctrico,Generador diesel 500kva,Energía,Cummins,C500,GEN987654,Sótano 2,Electricidad,activo,,Maquinaria,2022,Azul,,,321,1,Exterior B,2022-06-20,2022-06-05
";
    (
        [(axum::http::header::CONTENT_TYPE, "text/csv"), (axum::http::header::CONTENT_DISPOSITION, "attachment; filename=\"plantilla_activos.csv\"")],
        csv_content,
    )
}

pub async fn add_asset_document(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
    Json(payload): Json<AddDocumentRequest>,
) -> Result<impl IntoResponse, AppError> {
    let new_doc = activos_documentos::ActiveModel {
        activo_id: Set(id),
        nombre_archivo: Set(payload.nombre_archivo),
        url_archivo: Set(payload.url_archivo),
        ..Default::default()
    };

    let doc = new_doc.insert(&db).await?;

    Ok(Json(doc))
}

pub async fn delete_asset_document(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    activos_documentos::Entity::delete_by_id(id)
        .exec(&db)
        .await?;

    Ok(Json("Documento eliminado".to_string()))
}
