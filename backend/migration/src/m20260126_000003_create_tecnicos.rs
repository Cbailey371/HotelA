use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Create Tecnicos Table
        manager
            .create_table(
                Table::create()
                    .table(Tecnicos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Tecnicos::IdTecnico)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Tecnicos::Nombre).string().not_null())
                    .col(ColumnDef::new(Tecnicos::Apellido).string().not_null())
                    .col(ColumnDef::new(Tecnicos::Telefono).string().null())
                    .col(ColumnDef::new(Tecnicos::Email).string().null())
                    .col(ColumnDef::new(Tecnicos::Especialidad).string().null())
                    .col(ColumnDef::new(Tecnicos::ProveedorId).integer().null())
                    .col(ColumnDef::new(Tecnicos::EsIndependiente).boolean().not_null().default(true))
                    .col(ColumnDef::new(Tecnicos::CostoHora).decimal().null())
                    .col(ColumnDef::new(Tecnicos::Estado).string().not_null().default("activo"))
                    .col(ColumnDef::new(Tecnicos::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Tecnicos::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-tecnico-proveedor")
                            .from(Tecnicos::Table, Tecnicos::ProveedorId)
                            .to(Proveedores::Table, Proveedores::IdProveedor)
                    )
                    .to_owned(),
            )
            .await?;

        // 2. Update MantenimientoHistorial Table to add tecnico_id
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoHistorial::Table)
                    .add_column(
                        ColumnDef::new(MantenimientoHistorial::TecnicoId)
                            .integer()
                            .null(),
                    )
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk-historial-tecnico")
                            .from_tbl(MantenimientoHistorial::Table)
                            .from_col(MantenimientoHistorial::TecnicoId)
                            .to_tbl(Tecnicos::Table)
                            .to_col(Tecnicos::IdTecnico),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoHistorial::Table)
                    .drop_column(MantenimientoHistorial::TecnicoId)
                    .to_owned(),
            )
            .await?;

        manager
            .drop_table(Table::drop().table(Tecnicos::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Tecnicos {
    Table,
    IdTecnico,
    Nombre,
    Apellido,
    Telefono,
    Email,
    Especialidad,
    ProveedorId,
    EsIndependiente,
    CostoHora,
    Estado,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Proveedores {
    Table,
    IdProveedor,
}

#[derive(DeriveIden)]
enum MantenimientoHistorial {
    Table,
    TecnicoId,
}
