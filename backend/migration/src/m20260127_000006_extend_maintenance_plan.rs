use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoCalendario::CodigoMantenimiento)
                            .string()
                            .unique_key(),
                    )
                    .add_column(ColumnDef::new(MantenimientoCalendario::Prioridad).string()) // baja, media, alta, critica
                    .add_column(ColumnDef::new(MantenimientoCalendario::CostoEstimado).decimal().default(0.00))
                    .add_column(ColumnDef::new(MantenimientoCalendario::DiasAnticipacion).integer().default(0))
                    .add_column(ColumnDef::new(MantenimientoCalendario::ProveedorId).integer().null())
                    .add_column(ColumnDef::new(MantenimientoCalendario::TecnicoId).integer().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .drop_column(MantenimientoCalendario::CodigoMantenimiento)
                    .drop_column(MantenimientoCalendario::Prioridad)
                    .drop_column(MantenimientoCalendario::CostoEstimado)
                    .drop_column(MantenimientoCalendario::DiasAnticipacion)
                    .drop_column(MantenimientoCalendario::ProveedorId)
                    .drop_column(MantenimientoCalendario::TecnicoId)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    CodigoMantenimiento,
    Prioridad,
    CostoEstimado,
    DiasAnticipacion,
    ProveedorId,
    TecnicoId,
}
