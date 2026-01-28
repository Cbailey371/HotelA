use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add Foreign Key from orden_trabajo.id_calendario to mantenimiento_calendario.id_mantenimiento_calendario
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk_orden_trabajo_calendario")
                            .from_col(OrdenTrabajo::IdCalendario)
                            .to_tbl(MantenimientoCalendario::Table)
                            .to_col(MantenimientoCalendario::IdMantenimientoCalendario)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .drop_foreign_key(Alias::new("fk_orden_trabajo_calendario"))
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    IdCalendario,
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    IdMantenimientoCalendario,
}
