use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ReportesProgramados::Table)
                    .add_column(ColumnDef::new(ReportesProgramados::FechaInicio).date().not_null().default(Expr::current_date()))
                    .add_column(ColumnDef::new(ReportesProgramados::FechaFin).date())
                    .add_column(ColumnDef::new(ReportesProgramados::HoraEjecucion).time().not_null().default("08:00:00"))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ReportesProgramados::Table)
                    .drop_column(ReportesProgramados::FechaInicio)
                    .drop_column(ReportesProgramados::FechaFin)
                    .drop_column(ReportesProgramados::HoraEjecucion)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ReportesProgramados {
    Table,
    FechaInicio,
    FechaFin,
    HoraEjecucion,
}
