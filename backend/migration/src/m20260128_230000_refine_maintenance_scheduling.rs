use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add columns to mantenimiento_calendario
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoCalendario::Recurrente)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .add_column(
                        ColumnDef::new(MantenimientoCalendario::ResponsableInternoEmail)
                            .string()
                            .null(),
                    )
                    .to_owned(),
            )
            .await?;

        // Add column to mantenimiento_historial
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoHistorial::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoHistorial::ResponsableInternoEmail)
                            .string()
                            .null(),
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
                    .drop_column(MantenimientoHistorial::ResponsableInternoEmail)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .drop_column(MantenimientoCalendario::ResponsableInternoEmail)
                    .drop_column(MantenimientoCalendario::Recurrente)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    Recurrente,
    ResponsableInternoEmail,
}

#[derive(DeriveIden)]
enum MantenimientoHistorial {
    Table,
    ResponsableInternoEmail,
}
