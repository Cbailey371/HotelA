use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        // 1. Agregar permisos
        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO permisos (descripcion, codigo_permiso, modulo)
            SELECT 'Ver todas las solicitudes del portal', 'solicitudes_view_all', 'Órdenes de Trabajo'
            WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo_permiso = 'solicitudes_view_all');
            "#,
        )).await?;

        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO permisos (descripcion, codigo_permiso, modulo)
            SELECT 'Permitir vincular mantenimientos a OTs', 'work_orders_link_maintenance', 'Órdenes de Trabajo'
            WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo_permiso = 'work_orders_link_maintenance');
            "#,
        )).await?;

        // 2. Asignar por defecto a roles administrativos
        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO rol_permisos (rol_id, permiso_id)
            SELECT r.id_rol, p.id_permiso
            FROM roles r, permisos p
            WHERE r.nombre_rol IN ('ADMINISTRADOR', 'SUPER-ADMIN', 'ADMIN')
            AND p.codigo_permiso IN ('solicitudes_view_all', 'work_orders_link_maintenance')
            AND NOT EXISTS (
                SELECT 1 FROM rol_permisos rp 
                WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
            );
            "#,
        )).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        db.execute(Statement::from_string(
            backend,
            "DELETE FROM permisos WHERE codigo_permiso IN ('solicitudes_view_all', 'work_orders_link_maintenance');",
        )).await?;

        Ok(())
    }
}
