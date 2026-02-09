use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        // 1. Insert New Permissions
        // Feriados
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO permisos (codigo_permiso, descripcion, modulo) VALUES 
                ('holidays_view', 'Ver feriados', 'feriados'),
                ('holidays_manage', 'Gestionar feriados', 'feriados'),
                ('maintenance_plan_view', 'Ver plan de mantenimiento', 'mantenimiento'),
                ('maintenance_plan_edit', 'Gestionar plan de mantenimiento', 'mantenimiento')"#.to_owned(),
        )).await?;

        // 2. Link to SUPER-ADMIN (Link ALL new permissions)
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO rol_permisos (rol_id, permiso_id) 
               SELECT r.id_rol, p.id_permiso 
               FROM roles r 
               CROSS JOIN permisos p 
               WHERE r.nombre_rol = 'SUPER-ADMIN'
               AND p.codigo_permiso IN ('holidays_view', 'holidays_manage', 'maintenance_plan_view', 'maintenance_plan_edit')"#.to_owned(),
        )).await?;

        // 3. Link to ADMINISTRADOR (Link ALL new permissions)
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO rol_permisos (rol_id, permiso_id) 
               SELECT r.id_rol, p.id_permiso 
               FROM roles r 
               CROSS JOIN permisos p 
               WHERE r.nombre_rol = 'ADMINISTRADOR'
               AND p.codigo_permiso IN ('holidays_view', 'holidays_manage', 'maintenance_plan_view', 'maintenance_plan_edit')"#.to_owned(),
        )).await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
