use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoHistorial::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoHistorial::CalendarioId)
                            .integer()
                            .null(),
                    )
                    .add_column(
                        ColumnDef::new(MantenimientoHistorial::FechaEjecucion)
                            .date()
                            .null(),
                    )
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk-historial-calendario")
                            .from_tbl(MantenimientoHistorial::Table)
                            .from_col(MantenimientoHistorial::CalendarioId)
                            .to_tbl(MantenimientoCalendario::Table)
                            .to_col(MantenimientoCalendario::IdMantenimientoCalendario),
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
                    .drop_column(MantenimientoHistorial::CalendarioId)
                    .drop_column(MantenimientoHistorial::FechaEjecucion)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum MantenimientoHistorial {
    Table,
    CalendarioId,
    FechaEjecucion,
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    IdMantenimientoCalendario,
}
