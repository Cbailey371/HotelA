use chrono::{NaiveDate, Datelike, Duration};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, ConnectionTrait};
use crate::entities::{feriados_pa, excepciones_calendario, configuracion_calendario};

pub enum AjustePolitica {
    Anticipar, // Move to previous working day
    Postergar, // Move to next working day (Default)
    Mantener,  // Keep original date
}

pub async fn calculate_next_valid_date<C>(
    db: &C,
    target_date: NaiveDate,
    politica: AjustePolitica,
) -> Result<NaiveDate, Box<dyn std::error::Error>>
where C: ConnectionTrait {
    if is_working_day(db, target_date).await? {
        return Ok(target_date);
    }

    let mut current_date = target_date;
    match politica {
        AjustePolitica::Postergar => {
            while !is_working_day(db, current_date).await? {
                current_date += Duration::days(1);
            }
        },
        AjustePolitica::Anticipar => {
            while !is_working_day(db, current_date).await? {
                current_date -= Duration::days(1);
            }
        },
        AjustePolitica::Mantener => return Ok(target_date),
    }

    Ok(current_date)
}

pub async fn is_working_day<C>(
    db: &C,
    date: NaiveDate,
) -> Result<bool, Box<dyn std::error::Error>> 
where C: ConnectionTrait {
    // 1. Check Manual Exceptions (Highest Priority)
    // If it's an "Extra Working Day", return true immediately.
    // If it's a "Non-Working Day" (manual override), return false.
    let exception = excepciones_calendario::Entity::find()
        .filter(excepciones_calendario::Column::Fecha.eq(date))
        .one(db)
        .await?;

    if let Some(ex) = exception {
        if ex.tipo == "DIA_HABIL_EXTRA" {
            return Ok(true);
        } else if ex.tipo == "DIA_NO_LABORABLE" {
            return Ok(false);
        }
    }

    // 2. Check Panama Holidays
    // Logic: If it is a holiday in the table, it is not a working day.
    // The table `feriados_pa` should contain all effective holidays (including bridge days).
    let is_holiday = feriados_pa::Entity::find()
        .filter(feriados_pa::Column::Fecha.eq(date))
        .filter(feriados_pa::Column::Estado.eq("ACTIVO"))
        .one(db)
        .await?
        .is_some();

    if is_holiday {
        return Ok(false);
    }

    // 3. Check Weekly Schedule (Sundays off)
    // We could load this from `configuracion_calendario`, but for now hardcoded to Panama standard (Mon-Sat work).
    // Sunday = Weekday::Sun
    if date.weekday() == chrono::Weekday::Sun {
        return Ok(false);
    }

    Ok(true)
}

// Basic logic to check if a specific fixed holiday needs a bridge day
// This can be used by a background job or admin endpoint to populate the `feriados_pa` table
pub fn get_panama_fixed_holidays(year: i32) -> Vec<(NaiveDate, String)> {
    vec![
        (NaiveDate::from_ymd_opt(year, 1, 1).unwrap(), "Año Nuevo".to_string()),
        (NaiveDate::from_ymd_opt(year, 1, 9).unwrap(), "Día de los Mártires".to_string()),
        (NaiveDate::from_ymd_opt(year, 5, 1).unwrap(), "Día del Trabajo".to_string()),
        (NaiveDate::from_ymd_opt(year, 11, 3).unwrap(), "Separación de Colombia".to_string()),
        (NaiveDate::from_ymd_opt(year, 11, 5).unwrap(), "Día de Colón".to_string()),
        (NaiveDate::from_ymd_opt(year, 11, 10).unwrap(), "Grito de Independencia".to_string()),
        (NaiveDate::from_ymd_opt(year, 11, 28).unwrap(), "Independencia de España".to_string()),
        (NaiveDate::from_ymd_opt(year, 12, 8).unwrap(), "Día de la Madre".to_string()),
        (NaiveDate::from_ymd_opt(year, 12, 25).unwrap(), "Navidad".to_string()),
    ]
}
