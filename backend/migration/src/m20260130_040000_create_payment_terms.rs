use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(TerminosPago::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TerminosPago::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(TerminosPago::Nombre).string().not_null())
                    .col(ColumnDef::new(TerminosPago::Dias).integer().not_null().default(0))
                    .col(
                        ColumnDef::new(TerminosPago::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Seed initial data
        let insert = Query::insert()
            .into_table(TerminosPago::Table)
            .columns([TerminosPago::Nombre, TerminosPago::Dias])
            .values_panic(["Contado".into(), 0.into()])
            .values_panic(["Crédito 15 días".into(), 15.into()])
            .values_panic(["Crédito 30 días".into(), 30.into()])
            .values_panic(["Crédito 60 días".into(), 60.into()])
            .to_owned();

        manager.exec_stmt(insert).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TerminosPago::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum TerminosPago {
    Table,
    Id,
    Nombre,
    Dias,
    CreatedAt,
}
