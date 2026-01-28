use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create categorias_activos table
        manager
            .create_table(
                Table::create()
                    .table(CategoriasActivos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(CategoriasActivos::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(CategoriasActivos::Nombre).string().not_null().unique_key())
                    .col(ColumnDef::new(CategoriasActivos::Descripcion).string())
                    .col(
                        ColumnDef::new(CategoriasActivos::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create tipos_activos table
        manager
            .create_table(
                Table::create()
                    .table(TiposActivos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TiposActivos::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(TiposActivos::Nombre).string().not_null().unique_key())
                    .col(ColumnDef::new(TiposActivos::Descripcion).string())
                    .col(
                        ColumnDef::new(TiposActivos::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Seed Tables from existing data in activos_equipos
        // We use raw SQL for this to select distinct non-null values
        let db = manager.get_connection();
        
        // Seed Categorias
        db.execute(sea_orm::Statement::from_string(
            manager.get_database_backend(),
            r#"
            INSERT INTO categorias_activos (nombre)
            SELECT DISTINCT categoria FROM activos_equipos 
            WHERE categoria IS NOT NULL AND categoria != ''
            ON CONFLICT (nombre) DO NOTHING
            "#.to_string(),
        )).await?;

        // Seed Tipos
        db.execute(sea_orm::Statement::from_string(
            manager.get_database_backend(),
            r#"
            INSERT INTO tipos_activos (nombre)
            SELECT DISTINCT tipo_activo FROM activos_equipos 
            WHERE tipo_activo IS NOT NULL AND tipo_activo != ''
            ON CONFLICT (nombre) DO NOTHING
            "#.to_string(),
        )).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TiposActivos::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(CategoriasActivos::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum CategoriasActivos {
    Table,
    Id,
    Nombre,
    Descripcion,
    CreatedAt,
}

#[derive(DeriveIden)]
enum TiposActivos {
    Table,
    Id,
    Nombre,
    Descripcion,
    CreatedAt,
}
