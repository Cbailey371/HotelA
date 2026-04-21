use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Create table componentes_estandar
        manager
            .create_table(
                Table::create()
                    .table(ComponentesEstandar::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ComponentesEstandar::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ComponentesEstandar::Nombre).string().not_null())
                    .col(ColumnDef::new(ComponentesEstandar::Categoria).string().null())
                    .col(
                        ColumnDef::new(ComponentesEstandar::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Keyword::CurrentTimestamp),
                    )
                    .to_owned(),
            )
            .await?;

        // 2. Add componente_id to orden_trabajo
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .add_column(ColumnDef::new(OrdenTrabajo::ComponenteId).integer().null())
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk_ot_componente")
                            .from_tbl(OrdenTrabajo::Table)
                            .from_col(OrdenTrabajo::ComponenteId)
                            .to_tbl(ComponentesEstandar::Table)
                            .to_col(ComponentesEstandar::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 3. Add componente_id to mantenimiento_calendario
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .add_column(ColumnDef::new(MantenimientoCalendario::ComponenteId).integer().null())
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk_mantenimiento_componente")
                            .from_tbl(MantenimientoCalendario::Table)
                            .from_col(MantenimientoCalendario::ComponenteId)
                            .to_tbl(ComponentesEstandar::Table)
                            .to_col(ComponentesEstandar::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Seed basic components
        let insert = sea_query::Query::insert()
            .into_table(ComponentesEstandar::Table)
            .columns([ComponentesEstandar::Nombre, ComponentesEstandar::Categoria])
            .values_panic(vec!["Aire Acondicionado".into(), "Climatización".into()])
            .values_panic(vec!["Cama / Colchón".into(), "Mobiliario".into()])
            .values_panic(vec!["Ducha / Grifería".into(), "Plomería".into()])
            .values_panic(vec!["Inodoro".into(), "Plomería".into()])
            .values_panic(vec!["Lavamanos / Grifo".into(), "Plomería".into()])
            .values_panic(vec!["Televisor / Control Remoto".into(), "Electrónica".into()])
            .values_panic(vec!["Teléfono".into(), "Electrónica".into()])
            .values_panic(vec!["Cerradura Electrónica".into(), "Seguridad".into()])
            .values_panic(vec!["Lámparas / Bombillos".into(), "Eléctrico".into()])
            .values_panic(vec!["Silla".into(), "Mobiliario".into()])
            .to_owned();

        manager.exec_stmt(insert).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(MantenimientoCalendario::Table)
                    .drop_foreign_key(Alias::new("fk_mantenimiento_componente"))
                    .drop_column(MantenimientoCalendario::ComponenteId)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .drop_foreign_key(Alias::new("fk_ot_componente"))
                    .drop_column(OrdenTrabajo::ComponenteId)
                    .to_owned(),
            )
            .await?;

        manager
            .drop_table(Table::drop().table(ComponentesEstandar::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ComponentesEstandar {
    Table,
    Id,
    Nombre,
    Categoria,
    CreatedAt,
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    ComponenteId,
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    ComponenteId,
}
