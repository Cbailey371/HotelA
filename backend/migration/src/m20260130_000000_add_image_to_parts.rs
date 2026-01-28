use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .add_column(
                        ColumnDef::new(ActivosRepuestos::Imagen)
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
                    .table(ActivosRepuestos::Table)
                    .drop_column(ActivosRepuestos::Imagen)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    Imagen,
}
