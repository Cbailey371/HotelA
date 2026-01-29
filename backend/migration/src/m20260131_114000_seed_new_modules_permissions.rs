use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Insert new permissions
        manager.exec_stmt(
            Query::insert()
                .into_table(Permisos::Table)
                .columns([Permisos::CodigoPermiso, Permisos::Descripcion, Permisos::Modulo])
                // Reportes
                .values_panic(["reports_view".into(), "Ver reportes".into(), "reportes".into()])
                .values_panic(["reports_export".into(), "Exportar reportes".into(), "reportes".into()])
                // Auditoría
                .values_panic(["audit_view".into(), "Ver auditoría".into(), "auditoria".into()])
                // Configuración
                .values_panic(["settings_view".into(), "Ver configuración".into(), "configuracion".into()])
                .values_panic(["settings_edit".into(), "Editar configuración global".into(), "configuracion".into()])
                // Inventario (Extendido)
                .values_panic(["inventory_manage_brands".into(), "Gestionar Marcas".into(), "inventario".into()])
                .values_panic(["inventory_manage_locations".into(), "Gestionar Ubicaciones".into(), "inventario".into()])
                // Compras (Extendido)
                .values_panic(["purchases_receive".into(), "Recibir Mercancía".into(), "compras".into()])
                .to_owned()
        ).await?;

        // Assign to ADMINISTRADOR (Role ID 1)
        // We'll query them by code to get their IDs and map them to role 1
        // But SeaORM migration generic exec_stmt with subqueries is tricky.
        // Simplified approach: We assume IDs continue incrementing. 
        // Or better, we just insert into RolPermisos knowing the codes we just inserted?
        // No, we need IDs. 
        // Since we can't easily select-insert in generic migration trait without knowing dialect specifics (Postgres),
        // and we want to keep it simple:
        // We will assume the administrator has ID 1.
        // We will fetch the IDs of these new permissions using a subquery insert if possible, 
        // OR we just execute raw SQL for the linking which is often easier for migrations targeting specific DBs (Postgres here).
        // Let's use a subquery insert for Postgres.

        let db = manager.get_connection();
        let backend = manager.get_database_backend();
        
        // This raw SQL is Postgres specific but safest for "Link all 'reportes', 'auditoria', etc permissions to role 1"
        // IF we want to be pure ID agnostic. 
        // However, standard SeaORM practice often involves simpler logic.
        // Let's try to just insert the permissions first.
        
        // Now link them. We'll use a raw query to link all permissions that are NOT currently linked to role 1.
        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO rol_permisos (rol_id, permiso_id)
            SELECT 1, id_permiso
            FROM permisos
            WHERE codigo_permiso IN (
                'reports_view', 'reports_export', 
                'audit_view', 
                'settings_view', 'settings_edit',
                'inventory_manage_brands', 'inventory_manage_locations',
                'purchases_receive'
            )
            AND NOT EXISTS (
                SELECT 1 FROM rol_permisos WHERE rol_id = 1 AND permiso_id = permisos.id_permiso
            )
            "#
        )).await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Permisos { Table, CodigoPermiso, Descripcion, Modulo }
