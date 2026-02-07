use sea_orm::{DatabaseConnection, DbErr, ConnectionTrait, Statement, DatabaseBackend};

pub async fn generate_next_code<C>(
    db: &C,
    table: &str,
    column: &str,
    prefix: &str,
) -> Result<String, DbErr> 
where C: ConnectionTrait,
{
    // Query to find the maximum numeric part of the code with the given prefix.
    // matches: prefix followed by digits only
    // substring: extracts digits after prefix
    // cast: converts to integer for numerical max
    let sql = format!(
        "SELECT MAX(CAST(SUBSTRING({}, LENGTH('{}') + 1) AS INTEGER)) FROM {} WHERE {} ~ ('^' || '{}' || '[0-9]+$')",
        column, prefix, table, column, prefix
    );

    let stmt = Statement::from_string(DatabaseBackend::Postgres, sql);

    match db.query_one(stmt).await? {
        Some(res) => {
            // Try to get the MAX value. It might be NULL if no matching rows found.
            let _max_val: Option<i32> = res.try_get("", "max").ok(); 
            // Note: sea_orm query_one returns raw Row. The column name for aggregate might be tricky.
            // Actually, for raw query, we often alias it. Let's alias it as "max_val".
            
            // Re-constructing SQL with alias for safety
             let sql = format!(
                "SELECT MAX(CAST(SUBSTRING({}, LENGTH('{}') + 1) AS INTEGER)) as max_val FROM {} WHERE {} ~ ('^' || '{}' || '[0-9]+$')",
                column, prefix, table, column, prefix
            );
            let stmt = Statement::from_string(DatabaseBackend::Postgres, sql);
             match db.query_one(stmt).await? {
                Some(res) => {
                     let max_val: Option<i32> = res.try_get("", "max_val").unwrap_or(None);
                     let next_num = max_val.unwrap_or(0) + 1;
                     Ok(format!("{}{:03}", prefix, next_num))
                },
                None => Ok(format!("{}{:03}", prefix, 1))
             }
        },
        None => {
             // Should not happen for aggregate query (returns 1 row with null), but safe fallback
             Ok(format!("{}{:03}", prefix, 1))
        }
    }
}
