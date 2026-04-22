use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ActivoComponentes::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(ActivoComponentes::IdActivo).integer().not_null())
                    .col(ColumnDef::new(ActivoComponentes::IdComponente).integer().not_null())
                    .primary_key(
                        Index::create()
                            .name("pk_activo_componentes")
                            .col(ActivoComponentes::IdActivo)
                            .col(ActivoComponentes::IdComponente),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_activo_componentes_activo")
                            .from(ActivoComponentes::Table, ActivoComponentes::IdActivo)
                            .to(ActivosEquipos::Table, ActivosEquipos::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_activo_componentes_componente")
                            .from(ActivoComponentes::Table, ActivoComponentes::IdComponente)
                            .to(ComponentesEstandar::Table, ComponentesEstandar::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ActivoComponentes::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ActivoComponentes {
    Table,
    IdActivo,
    IdComponente,
}

#[derive(DeriveIden)]
enum ActivosEquipos {
    Table,
    #[sea_orm(iden = "id_equipo")]
    Id,
}

#[derive(DeriveIden)]
enum ComponentesEstandar {
    Table,
    Id,
}
