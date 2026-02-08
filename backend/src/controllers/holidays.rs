use axum::{Json, extract::{State, Query}, response::IntoResponse};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, QueryOrder};
use serde::{Deserialize, Serialize};
use crate::entities::feriados_pa;
use crate::utils::error::AppError;
use chrono::Datelike;

#[derive(Deserialize)]
pub struct HolidayFilter {
    pub year: Option<i32>,
}

#[derive(Serialize)]
pub struct HolidayDto {
    pub id: i32,
    pub fecha: String,
    pub descripcion: String,
    pub es_fijo: bool,
    pub estado: String,
}

pub async fn get_holidays(
    State(db): State<DatabaseConnection>,
    Query(params): Query<HolidayFilter>,
) -> Result<impl IntoResponse, AppError> {
    let year = params.year.unwrap_or_else(|| chrono::Local::now().year());
    
    // Simple filter by year range (Jan 1 to Dec 31)
    let start_date = chrono::NaiveDate::from_ymd_opt(year, 1, 1).unwrap();
    let end_date = chrono::NaiveDate::from_ymd_opt(year, 12, 31).unwrap();

    let holidays = feriados_pa::Entity::find()
        .filter(feriados_pa::Column::Fecha.gte(start_date))
        .filter(feriados_pa::Column::Fecha.lte(end_date))
        .order_by_asc(feriados_pa::Column::Fecha)
        .all(&db)
        .await?;

    let dtos: Vec<HolidayDto> = holidays.into_iter().map(|h| HolidayDto {
        id: h.id,
        fecha: h.fecha.to_string(),
        descripcion: h.descripcion,
        es_fijo: h.es_fijo,
        estado: h.estado,
    }).collect();

    Ok(Json(dtos))
}

// Endpoint to seed fixed holidays for a year if missing
pub async fn seed_holidays(
    State(db): State<DatabaseConnection>,
    Query(params): Query<HolidayFilter>,
) -> Result<impl IntoResponse, AppError> {
    let year = params.year.unwrap_or_else(|| chrono::Local::now().year());
    let mut holidays = crate::utils::scheduler::get_panama_fixed_holidays(year);
    let mut variable = crate::utils::scheduler::get_panama_variable_holidays(year);
    holidays.append(&mut variable);
    
    use sea_orm::{Set, ActiveModelTrait};

    for (date, desc) in holidays {
        // Check if exists
        let exists = feriados_pa::Entity::find()
            .filter(feriados_pa::Column::Fecha.eq(date))
            .one(&db)
            .await?;

        if exists.is_none() {
            let new_holiday = feriados_pa::ActiveModel {
                fecha: Set(date),
                descripcion: Set(desc),
                es_fijo: Set(true),
                estado: Set("ACTIVO".to_string()),
                ..Default::default()
            };
            new_holiday.insert(&db).await?;
        }
    }

    Ok(Json("Holidays seeded successfully"))
}

#[derive(Deserialize)]
pub struct CreateHolidayDto {
    pub fecha: chrono::NaiveDate,
    pub descripcion: String,
    pub es_fijo: bool,
}

pub async fn create_holiday(
    State(db): State<DatabaseConnection>,
    Json(payload): Json<CreateHolidayDto>,
) -> Result<impl IntoResponse, AppError> {
    use sea_orm::{Set, ActiveModelTrait};
    
    let new_holiday = feriados_pa::ActiveModel {
        fecha: Set(payload.fecha),
        descripcion: Set(payload.descripcion),
        es_fijo: Set(payload.es_fijo),
        estado: Set("ACTIVO".to_string()),
        ..Default::default()
    };
    
    new_holiday.insert(&db).await?;
    Ok(Json("Holiday created"))
}

pub async fn update_holiday(
    State(db): State<DatabaseConnection>,
    axum::extract::Path(id): axum::extract::Path<i32>,
    Json(payload): Json<CreateHolidayDto>,
) -> Result<impl IntoResponse, AppError> {
    use sea_orm::{Set, ActiveModelTrait};
    
    let holiday = feriados_pa::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Holiday not found".to_string()))?;
        
    let mut active: feriados_pa::ActiveModel = holiday.into();
    active.fecha = Set(payload.fecha);
    active.descripcion = Set(payload.descripcion);
    active.es_fijo = Set(payload.es_fijo);
    
    active.update(&db).await?;
    Ok(Json("Holiday updated"))
}

pub async fn delete_holiday(
    State(db): State<DatabaseConnection>,
    axum::extract::Path(id): axum::extract::Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    use sea_orm::ModelTrait;
    
    let holiday = feriados_pa::Entity::find_by_id(id)
        .one(&db)
        .await?
        .ok_or_else(|| AppError::NotFound("Holiday not found".to_string()))?;
        
    holiday.delete(&db).await?;
    Ok(Json("Holiday deleted"))
}

