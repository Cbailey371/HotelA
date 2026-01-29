use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Create compras_solicitudes table
        manager
            .create_table(
                Table::create()
                    .table(ComprasSolicitudes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ComprasSolicitudes::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ComprasSolicitudes::SolicitanteId).integer().not_null())
                    .col(ColumnDef::new(ComprasSolicitudes::FechaSolicitud).date().not_null())
                    .col(ColumnDef::new(ComprasSolicitudes::Motivo).text().not_null())
                    .col(ColumnDef::new(ComprasSolicitudes::Estado).string().not_null().default("PENDIENTE")) // PENDIENTE, APROBADA, RECHAZADA, PROCESADA
                    .col(ColumnDef::new(ComprasSolicitudes::Prioridad).string().not_null().default("NORMAL"))
                    .col(ColumnDef::new(ComprasSolicitudes::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(ComprasSolicitudes::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;

        // 2. Create compras_solicitud_detalle table
        manager
            .create_table(
                Table::create()
                    .table(ComprasSolicitudDetalle::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ComprasSolicitudDetalle::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ComprasSolicitudDetalle::SolicitudId).integer().not_null())
                    .col(ColumnDef::new(ComprasSolicitudDetalle::RepuestoId).integer().null()) // Nullable if it's a new item not in catalog
                    .col(ColumnDef::new(ComprasSolicitudDetalle::DescripcionItem).string().null()) // For items not in catalog
                    .col(ColumnDef::new(ComprasSolicitudDetalle::Cantidad).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_solicitud_detalle_solicitud")
                            .from(ComprasSolicitudDetalle::Table, ComprasSolicitudDetalle::SolicitudId)
                            .to(ComprasSolicitudes::Table, ComprasSolicitudes::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 3. Create inventario_movimientos table
        manager
            .create_table(
                Table::create()
                    .table(InventarioMovimientos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventarioMovimientos::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(InventarioMovimientos::RepuestoId).integer().not_null())
                    .col(ColumnDef::new(InventarioMovimientos::Tipo).string().not_null()) // ENTRADA_COMPRA, SALIDA_MANTENIMIENTO, RESERVA, ETC
                    .col(ColumnDef::new(InventarioMovimientos::Cantidad).integer().not_null())
                    .col(ColumnDef::new(InventarioMovimientos::ReferenciaId).integer().null())
                    .col(ColumnDef::new(InventarioMovimientos::Fecha).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(InventarioMovimientos::UsuarioId).integer().not_null())
                    .to_owned(),
            )
            .await?;

        // 4. Alter activos_repuestos table
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .add_column(
                        ColumnDef::new(ActivosRepuestos::StockReservado)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .to_owned(),
            )
            .await?;

        // 5. Alter orden_compra_repuesto table
         manager
            .alter_table(
                Table::alter()
                    .table(OrdenCompraRepuesto::Table)
                    .add_column(ColumnDef::new(OrdenCompraRepuesto::SolicitudId).integer().null()) // Nullable because manual POs exist
                    .add_column(ColumnDef::new(OrdenCompraRepuesto::EstadoRecepcion).string().default("PENDIENTE"))
                    .to_owned(),
            )
            .await?;


        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Reverse changes
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenCompraRepuesto::Table)
                    .drop_column(OrdenCompraRepuesto::SolicitudId)
                    .drop_column(OrdenCompraRepuesto::EstadoRecepcion)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .drop_column(ActivosRepuestos::StockReservado)
                    .to_owned(),
            )
            .await?;

        manager.drop_table(Table::drop().table(InventarioMovimientos::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(ComprasSolicitudDetalle::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(ComprasSolicitudes::Table).to_owned()).await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum ComprasSolicitudes {
    Table,
    Id,
    SolicitanteId,
    FechaSolicitud,
    Motivo,
    Estado,
    Prioridad,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ComprasSolicitudDetalle {
    Table,
    Id,
    SolicitudId,
    RepuestoId,
    DescripcionItem,
    Cantidad,
}

#[derive(DeriveIden)]
enum InventarioMovimientos {
    Table,
    Id,
    RepuestoId,
    Tipo,
    Cantidad,
    ReferenciaId,
    Fecha,
    UsuarioId,
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    StockReservado,
}

#[derive(DeriveIden)]
enum OrdenCompraRepuesto {
    Table,
    SolicitudId,
    EstadoRecepcion,
}
