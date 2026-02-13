use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(FacturasCompras::Table)
                    .modify_column(ColumnDef::new(FacturasCompras::IdOrdenCompra).integer().null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(FacturasComprasDetalle::Table)
                    .modify_column(ColumnDef::new(FacturasComprasDetalle::IdDetalleOc).integer().null())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(FacturasCompras::Table)
                    .modify_column(ColumnDef::new(FacturasCompras::IdOrdenCompra).integer().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(FacturasComprasDetalle::Table)
                    .modify_column(ColumnDef::new(FacturasComprasDetalle::IdDetalleOc).integer().not_null())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum FacturasCompras {
    Table,
    IdOrdenCompra,
}

#[derive(DeriveIden)]
enum FacturasComprasDetalle {
    Table,
    IdDetalleOc,
}
