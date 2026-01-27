use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Orden Trabajo
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("orden_trabajo"))
                    .add_column(ColumnDef::new(Alias::new("codigo_ot")).string().null())
                    .to_owned(),
            )
            .await?;

        // Orden Compra
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("orden_compra_repuesto"))
                    .add_column(ColumnDef::new(Alias::new("codigo_compra")).string().null())
                    .to_owned(),
            )
            .await?;

        // Proveedores
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("proveedores"))
                    .add_column(ColumnDef::new(Alias::new("codigo_proveedor")).string().null())
                    .to_owned(),
            )
            .await?;

        // Tecnicos
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("tecnicos"))
                    .add_column(ColumnDef::new(Alias::new("codigo_tecnico")).string().null())
                    .to_owned(),
            )
            .await?;

        // Usuarios
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("usuarios"))
                    .add_column(ColumnDef::new(Alias::new("codigo_usuario")).string().null())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(Table::alter().table(Alias::new("orden_trabajo")).drop_column(Alias::new("codigo_ot")).to_owned())
            .await?;
        manager
            .alter_table(Table::alter().table(Alias::new("orden_compra_repuesto")).drop_column(Alias::new("codigo_compra")).to_owned())
            .await?;
        manager
            .alter_table(Table::alter().table(Alias::new("proveedores")).drop_column(Alias::new("codigo_proveedor")).to_owned())
            .await?;
        manager
            .alter_table(Table::alter().table(Alias::new("tecnicos")).drop_column(Alias::new("codigo_tecnico")).to_owned())
            .await?;
        manager
            .alter_table(Table::alter().table(Alias::new("usuarios")).drop_column(Alias::new("codigo_usuario")).to_owned())
            .await?;

        Ok(())
    }
}
