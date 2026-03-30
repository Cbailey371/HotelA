use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // 1. Limpiar permisos de LIMPIEZA y SOLICITANTE (dejar solo lo básico)
        // Primero borrar todo lo que no sea acceso_portal o acceso_dashboard
        db.execute_unprepared("
            DELETE FROM rol_permisos 
            WHERE rol_id IN (SELECT id_rol FROM roles WHERE nombre_rol IN ('LIMPIEZA', 'SOLICITANTE'))
            AND permiso_id NOT IN (SELECT id_permiso FROM permisos WHERE codigo_permiso IN ('acceso_portal', 'acceso_dashboard'));
        ").await?;

        // 2. Asegurar que tengan acceso_portal y acceso_dashboard
        db.execute_unprepared("
            INSERT INTO rol_permisos (rol_id, permiso_id)
            SELECT r.id_rol, p.id_permiso
            FROM roles r, permisos p
            WHERE r.nombre_rol IN ('LIMPIEZA', 'SOLICITANTE', 'RECEPCION')
            AND p.codigo_permiso IN ('acceso_portal', 'acceso_dashboard')
            ON CONFLICT DO NOTHING;
        ").await?;

        // 3. Corregir el rol del usuario 'recepcion' para que use el rol 'RECEPCION' (ID 3)
        // Primero quitarle los roles actuales y ponerle el de RECEPCION
        db.execute_unprepared("
            DELETE FROM usuario_roles WHERE usuario_id = (SELECT id_usuario FROM usuarios WHERE usuario = 'recepcion');
        ").await?;
        
        db.execute_unprepared("
            INSERT INTO usuario_roles (usuario_id, rol_id)
            VALUES (
                (SELECT id_usuario FROM usuarios WHERE usuario = 'recepcion'),
                (SELECT id_rol FROM roles WHERE nombre_rol = 'RECEPCION')
            );
        ").await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
