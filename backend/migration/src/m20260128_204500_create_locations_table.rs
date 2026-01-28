use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create ubicaciones table
        manager
            .create_table(
                Table::create()
                    .table(Ubicaciones::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Ubicaciones::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Ubicaciones::Nombre).string().not_null().unique_key())
                    .col(ColumnDef::new(Ubicaciones::Descripcion).string())
                    .col(
                        ColumnDef::new(Ubicaciones::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Seed from existing data in activos_equipos
        let db = manager.get_connection();
        db.execute(sea_orm::Statement::from_string(
            manager.get_database_backend(),
            r#"
            INSERT INTO ubicaciones (nombre)
            SELECT DISTINCT ubicacion FROM activos_equipos 
            WHERE ubicacion IS NOT NULL AND ubicacion != ''
            ON CONFLICT (nombre) DO NOTHING
            "#.to_string(),
        )).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Ubicaciones::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Ubicaciones {
    Table,
    Id,
    Nombre,
    Descripcion,
    CreatedAt,
}
