use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create marcas table
        manager
            .create_table(
                Table::create()
                    .table(Marcas::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Marcas::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Marcas::Nombre).string().not_null().unique_key())
                    .col(ColumnDef::new(Marcas::Descripcion).string())
                    .col(
                        ColumnDef::new(Marcas::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create bodegas table
        manager
            .create_table(
                Table::create()
                    .table(Bodegas::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Bodegas::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Bodegas::Nombre).string().not_null().unique_key())
                    .col(ColumnDef::new(Bodegas::Ubicacion).string())
                    .col(ColumnDef::new(Bodegas::Descripcion).string())
                    .col(
                        ColumnDef::new(Bodegas::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Bodegas::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Marcas::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Marcas {
    Table,
    Id,
    Nombre,
    Descripcion,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Bodegas {
    Table,
    Id,
    Nombre,
    Ubicacion,
    Descripcion,
    CreatedAt,
}
