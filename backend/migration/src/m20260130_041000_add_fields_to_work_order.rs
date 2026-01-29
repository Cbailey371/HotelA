use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .add_column(
                        ColumnDef::new(OrdenTrabajo::CostoEstimado)
                            .decimal()
                            .null(),
                    )
                    .add_column(
                        ColumnDef::new(OrdenTrabajo::TerminosPago)
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
                    .table(OrdenTrabajo::Table)
                    .drop_column(OrdenTrabajo::CostoEstimado)
                    .drop_column(OrdenTrabajo::TerminosPago)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    CostoEstimado,
    TerminosPago,
}
