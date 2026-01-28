use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Configuraciones::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Configuraciones::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Configuraciones::Clave).string().not_null().unique_key())
                    .col(ColumnDef::new(Configuraciones::Valor).text().not_null())
                    .col(ColumnDef::new(Configuraciones::Descripcion).string())
                    .to_owned(),
            )
            .await?;

        // Seed initial SMTP keys
        let db = manager.get_connection();
        let backend = manager.get_database_backend();
        use sea_orm_migration::sea_orm::Statement;

        let initial_keys = vec![
            ("smtp_host", "", "Servidor SMTP"),
            ("smtp_port", "587", "Puerto SMTP"),
            ("smtp_user", "", "Usuario SMTP"),
            ("smtp_password", "", "Contraseña SMTP"),
            ("smtp_from_email", "", "Email remitente"),
        ];

        for (key, val, desc) in initial_keys {
            db.execute(Statement::from_string(
                backend,
                format!("INSERT INTO configuraciones (clave, valor, descripcion) VALUES ('{}', '{}', '{}') ON CONFLICT DO NOTHING", key, val, desc)
            )).await?;
        }

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Configuraciones::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Configuraciones {
    Table,
    Id,
    Clave,
    Valor,
    Descripcion,
}
