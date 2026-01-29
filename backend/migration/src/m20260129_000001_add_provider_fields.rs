use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Proveedores::Table)
                    .add_column_if_not_exists(
                        ColumnDef::new(Proveedores::RutORuc)
                            .string()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(Proveedores::Ciudad)
                            .string()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(Proveedores::SitioWeb)
                            .string()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(Proveedores::MetodosPagoAceptados)
                            .string()
                            .null(),
                    )
                    .add_column_if_not_exists(
                        ColumnDef::new(Proveedores::Observaciones)
                            .text()
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
                    .table(Proveedores::Table)
                    .drop_column(Proveedores::RutORuc)
                    .drop_column(Proveedores::Ciudad)
                    .drop_column(Proveedores::SitioWeb)
                    .drop_column(Proveedores::MetodosPagoAceptados)
                    .drop_column(Proveedores::Observaciones)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Proveedores {
    Table,
    RutORuc,
    Ciudad,
    SitioWeb,
    MetodosPagoAceptados,
    Observaciones,
}
