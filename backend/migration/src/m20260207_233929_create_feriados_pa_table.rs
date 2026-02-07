use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Feriados PA
        manager
            .create_table(
                Table::create()
                    .table(FeriadosPa::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(FeriadosPa::Id).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(FeriadosPa::Fecha).date().not_null())
                    .col(ColumnDef::new(FeriadosPa::Descripcion).string().not_null())
                    .col(ColumnDef::new(FeriadosPa::EsFijo).boolean().not_null().default(true))
                    .col(ColumnDef::new(FeriadosPa::Estado).string().not_null().default("ACTIVO"))
                    .to_owned(),
            )
            .await?;

        // 2. Configuracion Calendario
        manager
            .create_table(
                Table::create()
                    .table(ConfiguracionCalendario::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(ConfiguracionCalendario::Clave).string().not_null().primary_key())
                    .col(ColumnDef::new(ConfiguracionCalendario::Valor).json_binary().not_null())
                    .to_owned(),
            )
            .await?;

        // 3. Excepciones Calendario
        manager
            .create_table(
                Table::create()
                    .table(ExcepcionesCalendario::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(ExcepcionesCalendario::Id).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(ExcepcionesCalendario::Fecha).date().not_null())
                    .col(ColumnDef::new(ExcepcionesCalendario::Tipo).string().not_null()) // DIA_HABIL_EXTRA, DIA_NO_LABORABLE
                    .col(ColumnDef::new(ExcepcionesCalendario::Motivo).string())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.drop_table(Table::drop().table(ExcepcionesCalendario::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(ConfiguracionCalendario::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(FeriadosPa::Table).to_owned()).await
    }
}

#[derive(DeriveIden)]
enum FeriadosPa {
    Table,
    Id,
    Fecha,
    Descripcion,
    EsFijo,
    Estado,
}

#[derive(DeriveIden)]
enum ConfiguracionCalendario {
    Table,
    Clave,
    Valor,
}

#[derive(DeriveIden)]
enum ExcepcionesCalendario {
    Table,
    Id,
    Fecha,
    Tipo,
    Motivo,
}
