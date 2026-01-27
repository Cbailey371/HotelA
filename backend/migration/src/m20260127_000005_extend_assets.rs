use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosEquipos::Table)
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::TipoActivo).string().null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::Anio).integer().null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::Color).string_len(50).null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::NumeroMotor).string_len(100).null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::NumeroChasis).string_len(100).null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::ManualPdf).string().null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::Cantidad).integer().null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::UbicacionDetallada).string().null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::FechaInstalacion).date().null())
                    .add_column_if_not_exists(ColumnDef::new(ActivosEquipos::FechaBaja).date().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosEquipos::Table)
                    .drop_column(ActivosEquipos::TipoActivo)
                    .drop_column(ActivosEquipos::Anio)
                    .drop_column(ActivosEquipos::Color)
                    .drop_column(ActivosEquipos::NumeroMotor)
                    .drop_column(ActivosEquipos::NumeroChasis)
                    .drop_column(ActivosEquipos::ManualPdf)
                    .drop_column(ActivosEquipos::Cantidad)
                    .drop_column(ActivosEquipos::UbicacionDetallada)
                    .drop_column(ActivosEquipos::FechaInstalacion)
                    .drop_column(ActivosEquipos::FechaBaja)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ActivosEquipos {
    Table,
    TipoActivo,
    Anio,
    Color,
    NumeroMotor,
    NumeroChasis,
    ManualPdf,
    Cantidad,
    UbicacionDetallada,
    FechaInstalacion,
    FechaBaja,
}
