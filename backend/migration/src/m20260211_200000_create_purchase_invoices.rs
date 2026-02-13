use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Create facturas_compras table
        manager
            .create_table(
                Table::create()
                    .table(FacturasCompras::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FacturasCompras::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(FacturasCompras::IdOrdenCompra).integer().not_null())
                    .col(ColumnDef::new(FacturasCompras::IdProveedor).integer().not_null())
                    .col(ColumnDef::new(FacturasCompras::NumeroFactura).string().not_null())
                    .col(ColumnDef::new(FacturasCompras::FechaEmision).date().not_null())
                    .col(ColumnDef::new(FacturasCompras::FechaRecepcion).date().null())
                    .col(ColumnDef::new(FacturasCompras::Subtotal).decimal().not_null())
                    .col(ColumnDef::new(FacturasCompras::Impuestos).decimal().not_null())
                    .col(ColumnDef::new(FacturasCompras::Total).decimal().not_null())
                    .col(ColumnDef::new(FacturasCompras::Estado).string().not_null().default("PENDIENTE")) // PENDIENTE, RECIBIDA, ANULADA
                    .col(ColumnDef::new(FacturasCompras::Notas).text().null())
                    .col(ColumnDef::new(FacturasCompras::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_factura_orden_compra")
                            .from(FacturasCompras::Table, FacturasCompras::IdOrdenCompra)
                            .to(OrdenCompraRepuesto::Table, OrdenCompraRepuesto::IdOrdenCompra)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_factura_proveedor")
                            .from(FacturasCompras::Table, FacturasCompras::IdProveedor)
                            .to(Proveedores::Table, Proveedores::IdProveedor)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 2. Create facturas_compras_detalle table
        manager
            .create_table(
                Table::create()
                    .table(FacturasComprasDetalle::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FacturasComprasDetalle::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(FacturasComprasDetalle::IdFactura).integer().not_null())
                    .col(ColumnDef::new(FacturasComprasDetalle::IdRepuesto).integer().not_null())
                    .col(ColumnDef::new(FacturasComprasDetalle::IdDetalleOc).integer().not_null())
                    .col(ColumnDef::new(FacturasComprasDetalle::Cantidad).integer().not_null())
                    .col(ColumnDef::new(FacturasComprasDetalle::CostoUnitario).decimal().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_factura_detalle_factura")
                            .from(FacturasComprasDetalle::Table, FacturasComprasDetalle::IdFactura)
                            .to(FacturasCompras::Table, FacturasCompras::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_factura_detalle_repuesto")
                            .from(FacturasComprasDetalle::Table, FacturasComprasDetalle::IdRepuesto)
                            .to(ActivosRepuestos::Table, ActivosRepuestos::IdRepuesto)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_factura_detalle_oc_item")
                            .from(FacturasComprasDetalle::Table, FacturasComprasDetalle::IdDetalleOc)
                            .to(OrdenCompraDetalle::Table, OrdenCompraDetalle::IdDetalle)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.drop_table(Table::drop().table(FacturasComprasDetalle::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(FacturasCompras::Table).to_owned()).await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum FacturasCompras {
    Table,
    Id,
    IdOrdenCompra,
    IdProveedor,
    NumeroFactura,
    FechaEmision,
    FechaRecepcion,
    Subtotal,
    Impuestos,
    Total,
    Estado,
    Notas,
    CreatedAt,
}

#[derive(DeriveIden)]
enum FacturasComprasDetalle {
    Table,
    Id,
    IdFactura,
    IdRepuesto,
    IdDetalleOc,
    Cantidad,
    CostoUnitario,
}

#[derive(DeriveIden)]
enum OrdenCompraRepuesto {
    Table,
    IdOrdenCompra,
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

#[derive(DeriveIden)]
enum OrdenCompraDetalle {
    Table,
    IdDetalle,
}
