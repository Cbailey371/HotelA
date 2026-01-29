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
                        ColumnDef::new(Proveedores::Dv)
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
                    .table(Proveedores::Table)
                    .drop_column(Proveedores::Dv)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Proveedores {
    Table,
    Dv,
}
