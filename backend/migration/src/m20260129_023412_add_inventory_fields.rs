use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .add_column_if_not_exists(string_null(ActivosRepuestos::UbicacionFisicaExacta))
                    .add_column_if_not_exists(integer_null(ActivosRepuestos::ProveedorId))
                    .add_column_if_not_exists(date_null(ActivosRepuestos::FechaUltimaCompra))
                    .add_column_if_not_exists(date_null(ActivosRepuestos::FechaInstalacion))
                    .add_column_if_not_exists(date_null(ActivosRepuestos::FechaVencimiento))
                    .add_column_if_not_exists(string_null(ActivosRepuestos::CompatibilidadModelos))
                    .add_column_if_not_exists(string_null(ActivosRepuestos::VidaUtilEstimada))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .drop_column(ActivosRepuestos::UbicacionFisicaExacta)
                    .drop_column(ActivosRepuestos::ProveedorId)
                    .drop_column(ActivosRepuestos::FechaUltimaCompra)
                    .drop_column(ActivosRepuestos::FechaInstalacion)
                    .drop_column(ActivosRepuestos::FechaVencimiento)
                    .drop_column(ActivosRepuestos::CompatibilidadModelos)
                    .drop_column(ActivosRepuestos::VidaUtilEstimada)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    UbicacionFisicaExacta,
    ProveedorId,
    FechaUltimaCompra,
    FechaInstalacion,
    FechaVencimiento,
    CompatibilidadModelos,
    VidaUtilEstimada,
}
