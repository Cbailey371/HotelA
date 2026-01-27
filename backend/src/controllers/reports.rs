use axum::{extract::State, response::IntoResponse, http::{header, HeaderMap, StatusCode}};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait};
use crate::entities::activos_equipos;
use genpdf::elements;
use genpdf::fonts;

pub async fn generate_assets_report(
    State(db): State<DatabaseConnection>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // 1. Fetch data
    let assets = activos_equipos::Entity::find()
        .filter(activos_equipos::Column::Estado.eq("activo"))
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Create PDF
    let font_family = fonts::from_files("./assets/fonts", "Roboto", None)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to load fonts: {}", e)))?;
    
    let mut doc = genpdf::Document::new(font_family);
    doc.set_title("Reporte de Activos - Andros Asset Management");
    
    let mut decorator = genpdf::SimplePageDecorator::new();
    decorator.set_margins(10);
    doc.set_page_decorator(decorator);

    doc.push(elements::Text::new("Reporte de Activos"));
    doc.push(elements::Break::new(2));

    let mut table = elements::TableLayout::new(vec![1, 3, 2, 2, 2]);
    table.set_cell_decorator(elements::FrameCellDecorator::new(true, true, false));
    
    table.push_row(vec![
        Box::new(elements::Text::new("ID")),
        Box::new(elements::Text::new("Nombre")),
        Box::new(elements::Text::new("Código")),
        Box::new(elements::Text::new("Categoría")),
        Box::new(elements::Text::new("Ubicación")),
    ]).expect("Table row push failed");

    for asset in assets {
        table.push_row(vec![
            Box::new(elements::Text::new(asset.id_equipo.to_string())),
            Box::new(elements::Text::new(asset.nombre_equipo)),
            Box::new(elements::Text::new(asset.codigo_equipo)),
            Box::new(elements::Text::new(asset.categoria.unwrap_or_default())),
            Box::new(elements::Text::new(asset.ubicacion.unwrap_or_default())),
        ]).expect("Table row push failed");
    }

    doc.push(table);

    let mut buffer = Vec::new();
    doc.render(&mut buffer)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to render PDF: {}", e)))?;

    // 3. Return response
    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "application/pdf".parse().unwrap());
    headers.insert(
        header::CONTENT_DISPOSITION,
        "attachment; filename=\"reporte_activos.pdf\"".parse().unwrap(),
    );

    Ok((headers, buffer))
}
