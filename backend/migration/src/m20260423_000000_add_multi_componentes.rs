use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add componentes_ids column to mantenimiento_calendario
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .add_column(ColumnDef::new(MantenimientoCalendario::ComponentesIds).text().null())
                    .to_owned(),
            )
            .await?;

        // Add componentes_ids column to orden_trabajo
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .add_column(ColumnDef::new(OrdenTrabajo::ComponentesIds).text().null())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .drop_column(MantenimientoCalendario::ComponentesIds)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .drop_column(OrdenTrabajo::ComponentesIds)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    ComponentesIds,
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    ComponentesIds,
}
