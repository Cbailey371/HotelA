use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        // Update the module of the critical_fields_edit permission to 'inventario'
        // This ensures it shows up in the 'Inventario' block in the UI.
        db.execute(Statement::from_string(
            backend,
            r#"
            UPDATE permisos 
            SET modulo = 'inventario' 
            WHERE codigo_permiso = 'critical_fields_edit'
            "#
        )).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        db.execute(Statement::from_string(
            backend,
            r#"
            UPDATE permisos 
            SET modulo = 'general' 
            WHERE codigo_permiso = 'critical_fields_edit'
            "#
        )).await?;

        Ok(())
    }
}
