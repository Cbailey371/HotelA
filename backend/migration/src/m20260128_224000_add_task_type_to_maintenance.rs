use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add tarea_tipo_id to mantenimiento_calendario
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoCalendario::TareaTipoId)
                            .integer()
                            .null(),
                    )
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk-calendario-tarea-tipo")
                            .from_tbl(MantenimientoCalendario::Table)
                            .from_col(MantenimientoCalendario::TareaTipoId)
                            .to_tbl(MantenimientoTareas::Table)
                            .to_col(MantenimientoTareas::Id),
                    )
                    .to_owned(),
            )
            .await?;

        // Add tarea_tipo_id to mantenimiento_historial
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoHistorial::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoHistorial::TareaTipoId)
                            .integer()
                            .null(),
                    )
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk-historial-tarea-tipo")
                            .from_tbl(MantenimientoHistorial::Table)
                            .from_col(MantenimientoHistorial::TareaTipoId)
                            .to_tbl(MantenimientoTareas::Table)
                            .to_col(MantenimientoTareas::Id),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoHistorial::Table)
                    .drop_foreign_key(Alias::new("fk-historial-tarea-tipo"))
                    .drop_column(MantenimientoHistorial::TareaTipoId)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .drop_foreign_key(Alias::new("fk-calendario-tarea-tipo"))
                    .drop_column(MantenimientoCalendario::TareaTipoId)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum MantenimientoTareas {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    TareaTipoId,
}

#[derive(DeriveIden)]
enum MantenimientoHistorial {
    Table,
    TareaTipoId,
}
