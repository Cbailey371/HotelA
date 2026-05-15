use sea_orm::{DbErr, ConnectionTrait, Statement, DatabaseBackend};

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
    // Query to find the first available hole in the sequence, or the next value after MAX.
    // 1. Check if 1 is available
    // 2. Find the smallest n+1 that doesn't exist
    let sql = format!(
        "SELECT CASE 
            WHEN NOT EXISTS (SELECT 1 FROM {} WHERE {} = '{}' || '001') THEN 1
            ELSE (
                SELECT MIN(t1.val + 1)
                FROM (
                    SELECT CAST(SUBSTRING({}, LENGTH('{}') + 1) AS INTEGER) AS val 
                    FROM {} 
                    WHERE {} ~ ('^' || '{}' || '[0-9]+$')
                ) t1
                LEFT JOIN (
                    SELECT CAST(SUBSTRING({}, LENGTH('{}') + 1) AS INTEGER) AS val 
                    FROM {} 
                    WHERE {} ~ ('^' || '{}' || '[0-9]+$')
                ) t2 ON t1.val + 1 = t2.val
                WHERE t2.val IS NULL
            )
        END as next_val",
        table, column, prefix,
        column, prefix, table, column, prefix,
        column, prefix, table, column, prefix
    );

    let stmt = Statement::from_string(DatabaseBackend::Postgres, sql);

    match db.query_one(stmt).await? {
        Some(res) => {
            let next_num: i32 = res.try_get("", "next_val").unwrap_or(1);
            Ok(format!("{}{:03}", prefix, next_num))
        },
        None => Ok(format!("{}{:03}", prefix, 1))
    }
}
