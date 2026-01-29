use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenCompraRepuesto::Table)
                    .add_column_if_not_exists(
                        ColumnDef::new(OrdenCompraRepuesto::FechaEntrega)
                            .date()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(OrdenCompraRepuesto::TerminosPago)
                            .string()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(OrdenCompraRepuesto::Notas)
                            .text()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(OrdenCompraRepuesto::Impuestos)
                            .decimal()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(OrdenCompraRepuesto::Subtotal)
                            .decimal()
                            .null(),
                    )
                     .add_column_if_not_exists(
                        ColumnDef::new(OrdenCompraRepuesto::Total)
                            .decimal()
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
                    .table(OrdenCompraRepuesto::Table)
                    .drop_column(OrdenCompraRepuesto::FechaEntrega)
                    .drop_column(OrdenCompraRepuesto::TerminosPago)
                    .drop_column(OrdenCompraRepuesto::Notas)
                    .drop_column(OrdenCompraRepuesto::Impuestos)
                     .drop_column(OrdenCompraRepuesto::Subtotal)
                    .drop_column(OrdenCompraRepuesto::Total)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum OrdenCompraRepuesto {
    Table,
    FechaEntrega,
    TerminosPago,
    Notas,
    Impuestos,
    Subtotal,
    Total,
}
