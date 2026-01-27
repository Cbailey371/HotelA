use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create Orden Trabajo Table
        manager
            .create_table(
                Table::create()
                    .table(OrdenTrabajo::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrdenTrabajo::IdOt)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(OrdenTrabajo::IdCalendario).integer().null())
                    .col(ColumnDef::new(OrdenTrabajo::IdActivo).integer().not_null())
                    .col(ColumnDef::new(OrdenTrabajo::IdTipoMantenimiento).integer().null())
                    .col(ColumnDef::new(OrdenTrabajo::IdTecnico).integer().null())
                    .col(ColumnDef::new(OrdenTrabajo::IdProveedor).integer().null())
                    .col(ColumnDef::new(OrdenTrabajo::FechaInicioReal).date_time().null())
                    .col(ColumnDef::new(OrdenTrabajo::FechaFinReal).date_time().null())
                    .col(ColumnDef::new(OrdenTrabajo::Estado).string().default("abierta"))
                    .col(ColumnDef::new(OrdenTrabajo::Prioridad).string().default("media"))
                    .col(ColumnDef::new(OrdenTrabajo::Observaciones).text().null())
                    .col(
                        ColumnDef::new(OrdenTrabajo::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(OrdenTrabajo::UpdatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create Orden Compra Repuesto Table
        manager
            .create_table(
                Table::create()
                    .table(OrdenCompraRepuesto::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrdenCompraRepuesto::IdOrdenCompra)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(OrdenCompraRepuesto::IdOt).integer().null())
                    .col(ColumnDef::new(OrdenCompraRepuesto::IdProveedor).integer().null())
                    .col(ColumnDef::new(OrdenCompraRepuesto::FechaSolicitud).date().null())
                    .col(ColumnDef::new(OrdenCompraRepuesto::Estado).string().default("solicitado"))
                    .col(ColumnDef::new(OrdenCompraRepuesto::TotalEstimado).decimal().default(0.00))
                    .col(
                        ColumnDef::new(OrdenCompraRepuesto::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create Orden Compra Detalle Table
        manager
            .create_table(
                Table::create()
                    .table(OrdenCompraDetalle::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrdenCompraDetalle::IdDetalle)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(OrdenCompraDetalle::IdOrdenCompra).integer().not_null())
                    .col(ColumnDef::new(OrdenCompraDetalle::IdRepuesto).integer().not_null())
                    .col(ColumnDef::new(OrdenCompraDetalle::Cantidad).integer().not_null())
                    .col(ColumnDef::new(OrdenCompraDetalle::CostoUnitario).decimal().default(0.00))
                    .to_owned(),
            )
            .await?;
        
        // Add foreign key to Historial Repuestos
        manager
            .alter_table(
                Table::alter()
                    .table(HistorialRepuestos::Table)
                    .add_column(ColumnDef::new(HistorialRepuestos::OrdenTrabajoId).integer().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(HistorialRepuestos::Table)
                    .drop_column(HistorialRepuestos::OrdenTrabajoId)
                    .to_owned(),
            )
            .await?;

        manager
            .drop_table(Table::drop().table(OrdenCompraDetalle::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(OrdenCompraRepuesto::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(OrdenTrabajo::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    IdOt,
    IdCalendario,
    IdActivo,
    IdTipoMantenimiento,
    IdTecnico,
    IdProveedor,
    FechaInicioReal,
    FechaFinReal,
    Estado,
    Prioridad,
    Observaciones,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum OrdenCompraRepuesto {
    Table,
    IdOrdenCompra,
    IdOt,
    IdProveedor,
    FechaSolicitud,
    Estado,
    TotalEstimado,
    CreatedAt,
}

#[derive(DeriveIden)]
enum OrdenCompraDetalle {
    Table,
    IdDetalle,
    IdOrdenCompra,
    IdRepuesto,
    Cantidad,
    CostoUnitario,
}

#[derive(DeriveIden)]
enum HistorialRepuestos {
    Table,
    OrdenTrabajoId,
}
