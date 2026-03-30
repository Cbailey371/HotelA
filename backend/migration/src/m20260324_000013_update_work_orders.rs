use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Alter Orden Trabajo Table
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .modify_column(ColumnDef::new(OrdenTrabajo::IdActivo).integer().null())
                    .add_column(
                        ColumnDef::new(OrdenTrabajo::TipoOt)
                            .string()
                            .not_null()
                            .default("Preventiva"),
                    )
                    .add_column(ColumnDef::new(OrdenTrabajo::IdUbicacion).integer().null())
                    .add_column(ColumnDef::new(OrdenTrabajo::ComentarioFinal).text().null())
                    .add_foreign_key(
                        TableForeignKey::new()
                            .name("fk_ot_ubicacion")
                            .from_tbl(OrdenTrabajo::Table)
                            .from_col(OrdenTrabajo::IdUbicacion)
                            .to_tbl(Ubicaciones::Table)
                            .to_col(Ubicaciones::Id),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrdenTrabajo::Table)
                    .drop_foreign_key(Alias::new("fk_ot_ubicacion"))
                    .drop_column(OrdenTrabajo::ComentarioFinal)
                    .drop_column(OrdenTrabajo::IdUbicacion)
                    .drop_column(OrdenTrabajo::TipoOt)
                    .modify_column(ColumnDef::new(OrdenTrabajo::IdActivo).integer().not_null())
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    IdActivo,
    TipoOt,
    IdUbicacion,
    ComentarioFinal,
}

#[derive(DeriveIden)]
enum Ubicaciones {
    Table,
    Id,
}
