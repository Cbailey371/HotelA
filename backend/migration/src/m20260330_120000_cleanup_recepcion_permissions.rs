use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // 1. Quitar assets_view de RECEPCION (ya tienen acceso_portal para lo necesario)
        db.execute_unprepared("
            DELETE FROM rol_permisos 
            WHERE rol_id = (SELECT id_rol FROM roles WHERE nombre_rol = 'RECEPCION')
            AND permiso_id = (SELECT id_permiso FROM permisos WHERE codigo_permiso = 'assets_view');
        ").await?;

        // 2. Asegurar que RECEPCION NO tenga work_orders_view por error de datos previos
        db.execute_unprepared("
            DELETE FROM rol_permisos 
            WHERE rol_id = (SELECT id_rol FROM roles WHERE nombre_rol = 'RECEPCION')
            AND permiso_id = (SELECT id_permiso FROM permisos WHERE codigo_permiso = 'work_orders_view');
        ").await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
