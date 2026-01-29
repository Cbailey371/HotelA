use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenCompraDetalle::Table)
                    .add_column(
                        ColumnDef::new(OrdenCompraDetalle::CantidadRecibida)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
         manager
            .alter_table(
                Table::alter()
                    .table(OrdenCompraDetalle::Table)
                    .drop_column(OrdenCompraDetalle::CantidadRecibida)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum OrdenCompraDetalle {
    Table,
    CantidadRecibida,
}
