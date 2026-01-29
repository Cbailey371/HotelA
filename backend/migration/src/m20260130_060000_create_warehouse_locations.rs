use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create bodega_ubicaciones table
        manager
            .create_table(
                Table::create()
                    .table(BodegaUbicaciones::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(BodegaUbicaciones::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(BodegaUbicaciones::BodegaId).integer().not_null())
                    .col(ColumnDef::new(BodegaUbicaciones::Nombre).string().not_null())
                    .col(ColumnDef::new(BodegaUbicaciones::Descripcion).string())
                    .col(
                        ColumnDef::new(BodegaUbicaciones::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_bodega_ubicaciones_bodega_id")
                            .from(BodegaUbicaciones::Table, BodegaUbicaciones::BodegaId)
                            .to(Bodegas::Table, Bodegas::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Add fields to activos_repuestos (inventory)
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .add_column(ColumnDef::new(ActivosRepuestos::BodegaId).integer().null())
                    .add_column(ColumnDef::new(ActivosRepuestos::UbicacionBodegaId).integer().null())
                    .to_owned(),
            )
            .await?;

        // Add FKs separately
        manager.create_foreign_key(
            ForeignKey::create()
                .name("fk_activos_repuestos_bodega_id")
                .from(ActivosRepuestos::Table, ActivosRepuestos::BodegaId)
                .to(Bodegas::Table, Bodegas::Id)
                .on_delete(ForeignKeyAction::SetNull)
                .on_update(ForeignKeyAction::Cascade)
                .to_owned()
        ).await?;

        manager.create_foreign_key(
            ForeignKey::create()
                .name("fk_activos_repuestos_ubicacion_bodega_id")
                .from(ActivosRepuestos::Table, ActivosRepuestos::UbicacionBodegaId)
                .to(BodegaUbicaciones::Table, BodegaUbicaciones::Id)
                .on_delete(ForeignKeyAction::SetNull)
                .on_update(ForeignKeyAction::Cascade)
                .to_owned()
        ).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop FKs
        manager.drop_foreign_key(
            ForeignKey::drop()
                .name("fk_activos_repuestos_ubicacion_bodega_id")
                .table(ActivosRepuestos::Table)
                .to_owned()
        ).await?;

        manager.drop_foreign_key(
            ForeignKey::drop()
                .name("fk_activos_repuestos_bodega_id")
                .table(ActivosRepuestos::Table)
                .to_owned()
        ).await?;

        // Remove table
        manager
            .drop_table(Table::drop().table(BodegaUbicaciones::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum BodegaUbicaciones {
    Table,
    Id,
    BodegaId,
    Nombre,
    Descripcion,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Bodegas {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    BodegaId,
    UbicacionBodegaId,
}
