use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Add 'sku' to 'activos_repuestos'
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .add_column(ColumnDef::new(ActivosRepuestos::Sku).string().null())
                    .to_owned(),
            )
            .await?;

        // 2. Create 'repuestos_equipos' junction table
        manager
            .create_table(
                Table::create()
                    .table(RepuestosEquipos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(RepuestosEquipos::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(RepuestosEquipos::RepuestoId).integer().not_null())
                    .col(ColumnDef::new(RepuestosEquipos::EquipoId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_repuestos_equipos_repuesto")
                            .from(RepuestosEquipos::Table, RepuestosEquipos::RepuestoId)
                            .to(ActivosRepuestos::Table, ActivosRepuestos::IdRepuesto)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_repuestos_equipos_equipo")
                            .from(RepuestosEquipos::Table, RepuestosEquipos::EquipoId)
                            .to(ActivosEquipos::Table, ActivosEquipos::IdEquipo)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    // Ensure unique pair
                    .index(
                        Index::create()
                            .name("idx_repuesto_equipo_unique")
                            .table(RepuestosEquipos::Table)
                            .col(RepuestosEquipos::RepuestoId)
                            .col(RepuestosEquipos::EquipoId)
                            .unique(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop table first
        manager
            .drop_table(Table::drop().table(RepuestosEquipos::Table).to_owned())
            .await?;

        // Drop column
        manager
            .alter_table(
                Table::alter()
                    .table(ActivosRepuestos::Table)
                    .drop_column(ActivosRepuestos::Sku)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    IdRepuesto,
    Sku,
}

#[derive(DeriveIden)]
enum ActivosEquipos {
    Table,
    IdEquipo,
}

#[derive(DeriveIden)]
enum RepuestosEquipos {
    Table,
    Id,
    RepuestoId,
    EquipoId,
}
