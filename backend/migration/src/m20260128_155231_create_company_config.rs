use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ConfigEmpresa::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ConfigEmpresa::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ConfigEmpresa::Logo).text())
                    .col(ColumnDef::new(ConfigEmpresa::NombreComercial).string().not_null())
                    .col(ColumnDef::new(ConfigEmpresa::RazonSocial).string().not_null())
                    .col(ColumnDef::new(ConfigEmpresa::Ruc).string().not_null())
                    .col(ColumnDef::new(ConfigEmpresa::Dv).string().not_null())
                    .col(ColumnDef::new(ConfigEmpresa::Telefono).string().not_null())
                    .col(ColumnDef::new(ConfigEmpresa::Correo).string().not_null())
                    .col(ColumnDef::new(ConfigEmpresa::Direccion).text().not_null())
                    .col(ColumnDef::new(ConfigEmpresa::Ciudad).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ConfigEmpresa::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ConfigEmpresa {
    Table,
    Id,
    Logo,
    NombreComercial,
    RazonSocial,
    Ruc,
    Dv,
    Telefono,
    Correo,
    Direccion,
    Ciudad,
}
