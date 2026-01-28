use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ActivosDocumentos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ActivosDocumentos::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ActivosDocumentos::ActivoId).integer().not_null())
                    .col(ColumnDef::new(ActivosDocumentos::NombreArchivo).string().not_null())
                    .col(ColumnDef::new(ActivosDocumentos::UrlArchivo).string().not_null())
                    .col(ColumnDef::new(ActivosDocumentos::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_documents_asset")
                            .from(ActivosDocumentos::Table, ActivosDocumentos::ActivoId)
                            .to(ActivosEquipos::Table, ActivosEquipos::IdEquipo)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Optional: Data migration if we want to move manual_pdf to this table
        // For now we keep it separate to avoid breaking things.

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ActivosDocumentos::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ActivosDocumentos {
    Table,
    Id,
    ActivoId,
    NombreArchivo,
    UrlArchivo,
    CreatedAt,
}

#[derive(DeriveIden)]
enum ActivosEquipos {
    Table,
    IdEquipo,
}
