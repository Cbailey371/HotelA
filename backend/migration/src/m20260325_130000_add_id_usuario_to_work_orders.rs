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
                    .add_column(ColumnDef::new(OrdenTrabajo::IdUsuario).integer().null())
                    .to_owned(),
            )
            .await?;
            
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .drop_column(OrdenTrabajo::IdUsuario)
                    .to_owned(),
            )
            .await?;
            
        Ok(())
    }
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    IdUsuario,
}
