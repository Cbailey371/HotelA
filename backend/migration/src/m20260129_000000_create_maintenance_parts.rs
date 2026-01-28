use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(MantenimientoRepuestos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MantenimientoRepuestos::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(MantenimientoRepuestos::MantenimientoId)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(MantenimientoRepuestos::RepuestoId)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(MantenimientoRepuestos::CantidadEstimada)
                            .decimal()
                            .not_null()
                            .default(1.0),
                    )
                    .col(
                        ColumnDef::new(MantenimientoRepuestos::CostoEstimado)
                            .decimal()
                            .not_null()
                            .default(0.0),
                    )
                    .col(
                        ColumnDef::new(MantenimientoRepuestos::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_mantenimiento_repuestos_calendario")
                            .from(MantenimientoRepuestos::Table, MantenimientoRepuestos::MantenimientoId)
                            .to(MantenimientoCalendario::Table, MantenimientoCalendario::IdMantenimientoCalendario)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_mantenimiento_repuestos_activo")
                            .from(MantenimientoRepuestos::Table, MantenimientoRepuestos::RepuestoId)
                            .to(ActivosRepuestos::Table, ActivosRepuestos::IdRepuesto)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(MantenimientoRepuestos::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum MantenimientoRepuestos {
    Table,
    Id,
    MantenimientoId,
    RepuestoId,
    CantidadEstimada,
    CostoEstimado,
    CreatedAt,
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    IdMantenimientoCalendario,
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    IdRepuesto,
}
