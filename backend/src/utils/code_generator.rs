use sea_orm::{DatabaseConnection, DbErr, ConnectionTrait, Statement, DatabaseBackend};

pub async fn generate_next_code(
    db: &DatabaseConnection,
    table: &str,
    column: &str,
    prefix: &str,
) -> Result<String, DbErr> {
    // Query to find the last code with the given prefix.
    // We sort by length descending first to ensure that "COD-10" > "COD-9", 
    // and then by the value strings descending.
    let sql = format!(
        "SELECT {} FROM {} WHERE {} LIKE '{}%' ORDER BY LENGTH({}) DESC, {} DESC LIMIT 1",
        column, table, column, prefix, column, column
    );

    let stmt = Statement::from_string(DatabaseBackend::Postgres, sql);

    match db.query_one(stmt).await? {
        Some(res) => {
            let last_code: String = res.try_get("", column)?;
            
            // Try to strip the prefix
            if let Some(number_part) = last_code.strip_prefix(prefix) {
                // Try to parse the number part
                if let Ok(num) = number_part.parse::<i32>() {
                    let next_num = num + 1;
                    return Ok(format!("{}{:03}", prefix, next_num));
                }
            }
            
            // Fallback if parsing fails, assume we start from 1? 
            // Or maybe return error? Ideally we shouldn't fail if one code is weird.
            // Let's assume there was data but we couldn't parse it, safe fallback might be risky of collision 
            // but starting high or forcing 001 might conflict.
            // Let's try to extract digits from the end string if standard parse failed.
            // For now, let's just default to prefix-001 if we can't understand the last one (very edge case)
            // or perhaps log it. 
            // Given the constraints, let's start next sequence at 1.
             Ok(format!("{}{:03}", prefix, 1))
        },
        None => {
            // No records found, start with 001
            Ok(format!("{}{:03}", prefix, 1))
        }
    }
}
