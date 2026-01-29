use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ReportesProgramados::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ReportesProgramados::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ReportesProgramados::Nombre).string().not_null())
                    .col(ColumnDef::new(ReportesProgramados::TipoReporte).string().not_null())
                    .col(ColumnDef::new(ReportesProgramados::Frecuencia).string().not_null())
                    .col(ColumnDef::new(ReportesProgramados::Filtros).json_binary())
                    .col(ColumnDef::new(ReportesProgramados::UltimoEnvio).timestamp_with_time_zone())
                    .col(ColumnDef::new(ReportesProgramados::ProximoEnvio).timestamp_with_time_zone())
                    .col(ColumnDef::new(ReportesProgramados::Destinatarios).string()) 
                    .col(ColumnDef::new(ReportesProgramados::Activo).boolean().default(true))
                    .col(
                        ColumnDef::new(ReportesProgramados::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(ReportesProgramados::UpdatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ReportesProgramados::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ReportesProgramados {
    Table,
    Id,
    Nombre,
    TipoReporte,
    Frecuencia,
    Filtros,
    UltimoEnvio,
    ProximoEnvio,
    Destinatarios,
    Activo,
    CreatedAt,
    UpdatedAt,
}
