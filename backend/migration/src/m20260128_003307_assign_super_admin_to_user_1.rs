use sea_orm_migration::{prelude::*, schema::*};
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
         let db = manager.get_connection();
         let backend = manager.get_database_backend();
         
         // Assign SUPER-ADMIN to User ID 1 if not already assigned
         db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO usuario_roles (usuario_id, rol_id)
               SELECT u.id_usuario, r.id_rol
               FROM usuarios u, roles r
               WHERE u.id_usuario = 1 AND r.nombre_rol = 'SUPER-ADMIN'
               AND NOT EXISTS (
                   SELECT 1 FROM usuario_roles ur 
                   WHERE ur.usuario_id = u.id_usuario AND ur.rol_id = r.id_rol
               )"#.to_owned(),
         )).await?;
         
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Post {
    Table,
    Id,
    Title,
    Text,
}
