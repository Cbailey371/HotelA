use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(OrdenTrabajoComentarios::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrdenTrabajoComentarios::IdComentario)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(OrdenTrabajoComentarios::OtId).integer().not_null())
                    .col(ColumnDef::new(OrdenTrabajoComentarios::UsuarioId).integer().not_null())
                    .col(ColumnDef::new(OrdenTrabajoComentarios::Comentario).text().not_null())
                    .col(
                        ColumnDef::new(OrdenTrabajoComentarios::FechaHora)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_ot_comentario_ot")
                            .from(OrdenTrabajoComentarios::Table, OrdenTrabajoComentarios::OtId)
                            .to(OrdenTrabajo::Table, OrdenTrabajo::IdOt)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_ot_comentario_usuario")
                            .from(OrdenTrabajoComentarios::Table, OrdenTrabajoComentarios::UsuarioId)
                            .to(Usuarios::Table, Usuarios::IdUsuario),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(OrdenTrabajoComentarios::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum OrdenTrabajoComentarios {
    Table,
    IdComentario,
    OtId,
    UsuarioId,
    Comentario,
    FechaHora,
}

#[derive(DeriveIden)]
enum OrdenTrabajo {
    Table,
    IdOt,
}

#[derive(DeriveIden)]
enum Usuarios {
    Table,
    IdUsuario,
}
