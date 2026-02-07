use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add orden_trabajo_id column to mantenimiento_calendario
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoCalendario::OrdenTrabajoId)
                            .integer()
                            .null(),
                    )
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk_mantenimiento_orden_trabajo")
                            .from_tbl(MantenimientoCalendario::Table)
                            .from_col(MantenimientoCalendario::OrdenTrabajoId)
                            .to_tbl(OrdenTrabajo::Table)
                            .to_col(OrdenTrabajo::IdOt)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
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
                    .drop_column(MantenimientoCalendario::OrdenTrabajoId)
                    .drop_foreign_key(Alias::new("fk_mantenimiento_orden_trabajo"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    OrdenTrabajoId,
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    IdOt,
}
