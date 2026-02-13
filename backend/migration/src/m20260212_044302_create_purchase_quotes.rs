use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Create Purchase Quote (Header) Table
        manager
            .create_table(
                Table::create()
                    .table(ComprasCotizaciones::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ComprasCotizaciones::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ComprasCotizaciones::ProveedorId).integer().not_null())
                    .col(ColumnDef::new(ComprasCotizaciones::FechaSolicitud).date().not_null())
                    .col(ColumnDef::new(ComprasCotizaciones::Codigo).string().not_null())
                    .col(ColumnDef::new(ComprasCotizaciones::Estado).string().not_null().default("BORRADOR"))
                    .col(ColumnDef::new(ComprasCotizaciones::Observaciones).text())
                    .col(
                        ColumnDef::new(ComprasCotizaciones::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                     .foreign_key(
                        ForeignKey::create()
                            .name("fk_cotizacion_proveedor")
                            .from(ComprasCotizaciones::Table, ComprasCotizaciones::ProveedorId)
                            .to(Proveedores::Table, Proveedores::IdProveedor)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 2. Create Purchase Quote Detail Table
        manager
            .create_table(
                Table::create()
                    .table(ComprasCotizacionDetalle::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ComprasCotizacionDetalle::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ComprasCotizacionDetalle::CotizacionId).integer().not_null())
                    .col(ColumnDef::new(ComprasCotizacionDetalle::RepuestoId).integer().not_null())
                    .col(ColumnDef::new(ComprasCotizacionDetalle::Cantidad).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_detalle_cotizacion")
                            .from(ComprasCotizacionDetalle::Table, ComprasCotizacionDetalle::CotizacionId)
                            .to(ComprasCotizaciones::Table, ComprasCotizaciones::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_detalle_repuesto_rfq")
                            .from(ComprasCotizacionDetalle::Table, ComprasCotizacionDetalle::RepuestoId)
                            .to(ActivosRepuestos::Table, ActivosRepuestos::IdRepuesto)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ComprasCotizacionDetalle::Table).to_owned())
            .await?;
            
        manager
            .drop_table(Table::drop().table(ComprasCotizaciones::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ComprasCotizaciones {
    Table,
    Id,
    ProveedorId,
    FechaSolicitud,
    Codigo,
    Estado,
    Observaciones,
    CreatedAt,
}

#[derive(DeriveIden)]
enum ComprasCotizacionDetalle {
    Table,
    Id,
    CotizacionId,
    RepuestoId,
    Cantidad,
}

#[derive(DeriveIden)]
enum Proveedores {
    Table,
    IdProveedor,
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    IdRepuesto,
}
