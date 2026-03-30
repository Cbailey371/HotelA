use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        // 1. Insertar el nuevo permiso si no existe
        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO permisos (descripcion, codigo_permiso, modulo)
            SELECT 'Acceso al Dashboard Principal', 'acceso_dashboard', 'Dashboard'
            WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo_permiso = 'acceso_dashboard');
            "#,
        )).await?;

        // 2. Asignar el permiso a la mayoría de los roles (excepto quizás SOLICITANTE puro si fuera muy restrictivo, 
        // pero por ahora el dashboard es general para ver estadísticas básicas)
        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO rol_permisos (rol_id, permiso_id)
            SELECT r.id_rol, p.id_permiso
            FROM roles r, permisos p
            WHERE r.nombre_rol IN ('SUPER-ADMIN', 'ADMINISTRADOR', 'ADMIN', 'TECNICO', 'ALMACENERO', 'SUPERVISOR', 'RECEPCION')
            AND p.codigo_permiso = 'acceso_dashboard'
            AND NOT EXISTS (
                SELECT 1 FROM rol_permisos WHERE rol_id = r.id_rol AND permiso_id = p.id_permiso
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
            r#"
            DELETE FROM rol_permisos 
            WHERE permiso_id IN (SELECT id_permiso FROM permisos WHERE codigo_permiso = 'acceso_dashboard');
            "#,
        )).await?;

        db.execute(Statement::from_string(
            backend,
            r#"
            DELETE FROM permisos WHERE codigo_permiso = 'acceso_dashboard';
            "#,
        )).await?;

        Ok(())
    }
}
