use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;
use argon2::{
    password_hash::{
        rand_core::OsRng, PasswordHasher, SaltString
    },
    Argon2,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        // Generate Argon2 hash for password "admin"
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(b"admin", &salt)
            .map_err(|e| DbErr::Custom(e.to_string()))?
            .to_string();

        db.execute(Statement::from_string(
            backend,
            format!(
                "UPDATE usuarios SET password_hash = '{}' WHERE usuario = 'admin'",
                password_hash
            )
        )).await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
