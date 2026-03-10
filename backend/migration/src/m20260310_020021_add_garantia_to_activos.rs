use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosEquipos::Table)
                    .add_column(ColumnDef::new(ActivosEquipos::GarantiaMeses).integer().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosEquipos::Table)
                    .drop_column(ActivosEquipos::GarantiaMeses)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ActivosEquipos {
    Table,
    GarantiaMeses,
}
