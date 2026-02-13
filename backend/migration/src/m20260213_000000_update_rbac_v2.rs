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
        let perms = vec![
            // Mantenimiento
            ("maintenance_view", "Ver mantenimientos", "mantenimiento"),
            ("maintenance_execute", "Ejecutar mantenimientos", "mantenimiento"),
            ("maintenance_manage_types", "Gestionar tipos de mantenimiento", "mantenimiento"),
            // Órdenes de Trabajo
            ("work_orders_create", "Crear órdenes de trabajo", "mantenimiento"),
            ("work_orders_delete", "Eliminar órdenes de trabajo", "mantenimiento"),
            ("work_orders_close", "Cerrar órdenes de trabajo", "mantenimiento"),
            // Inventario
            ("inventory_history", "Ver historial de inventario", "inventario"),
            ("inventory_adjust", "Realizar ajustes de inventario", "inventario"),
            // Facturas de Compra
            ("invoices_view", "Ver facturas de compra", "compras"),
            ("invoices_create", "Crear facturas de compra", "compras"),
            ("invoices_edit", "Editar facturas de compra", "compras"),
            ("invoices_delete", "Eliminar facturas de compra", "compras"),
            // Solicitudes de Cotización / Compra
            ("solicitudes_view", "Ver solicitudes de cotización", "compras"),
            ("solicitudes_create", "Crear solicitudes de cotización", "compras"),
            ("solicitudes_edit", "Editar solicitudes de cotización", "compras"),
            ("solicitudes_delete", "Eliminar solicitudes de cotización", "compras"),
            // Activos
            ("assets_delete", "Eliminar activos", "activos"),
        ];

        for (code, desc, module) in perms {
            let sql = format!(
                "INSERT INTO permisos (codigo_permiso, descripcion, modulo) \
                 SELECT '{}', '{}', '{}' \
                 WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo_permiso = '{}');",
                code, desc, module, code
            );
            db.execute(Statement::from_string(backend, sql)).await?;
        }

        // 2. Link ALL permissions to ADMINISTRADOR (Role 1) and SUPER-ADMIN (if exists)
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO rol_permisos (rol_id, permiso_id)
               SELECT r.id_rol, p.id_permiso
               FROM roles r
               CROSS JOIN permisos p
               WHERE r.nombre_rol IN ('ADMINISTRADOR', 'SUPER-ADMIN')
               AND NOT EXISTS (
                   SELECT 1 FROM rol_permisos rp 
                   WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
               )"#.to_owned(),
        )).await?;

        // 3. Create/Update TECNICO Role
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO roles (nombre_rol, descripcion, estado)
               SELECT 'TECNICO', 'Acceso a ejecución de mantenimientos y OTs', 'activo'
               WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'TECNICO')"#.to_owned(),
        )).await?;

        // Assign permissions to TECNICO
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO rol_permisos (rol_id, permiso_id)
               SELECT r.id_rol, p.id_permiso
               FROM roles r
               CROSS JOIN permisos p
               WHERE r.nombre_rol = 'TECNICO'
               AND p.codigo_permiso IN (
                   'assets_view', 'techs_view', 'inventory_view',
                   'work_orders_view', 'work_orders_edit', 'work_orders_close',
                   'maintenance_view', 'maintenance_execute', 'maintenance_plan_view'
               )
               AND NOT EXISTS (
                   SELECT 1 FROM rol_permisos rp 
                   WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
               )"#.to_owned(),
        )).await?;

        // 4. Create ALMACENERO Role
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO roles (nombre_rol, descripcion, estado)
               SELECT 'ALMACENERO', 'Gestión de inventario y recepción de compras', 'activo'
               WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'ALMACENERO')"#.to_owned(),
        )).await?;

        // Assign permissions to ALMACENERO
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO rol_permisos (rol_id, permiso_id)
               SELECT r.id_rol, p.id_permiso
               FROM roles r
               CROSS JOIN permisos p
               WHERE r.nombre_rol = 'ALMACENERO'
               AND p.codigo_permiso IN (
                   'inventory_view', 'inventory_edit', 'inventory_history', 'inventory_adjust',
                   'inventory_manage_brands', 'inventory_manage_locations',
                   'purchases_view', 'purchases_receive', 'invoices_view', 'invoices_create',
                   'providers_view'
               )
               AND NOT EXISTS (
                   SELECT 1 FROM rol_permisos rp 
                   WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
               )"#.to_owned(),
        )).await?;

        // 5. Create SUPERVISOR Role
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO roles (nombre_rol, descripcion, estado)
               SELECT 'SUPERVISOR', 'Supervisión de operaciones y reportes', 'activo'
               WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'SUPERVISOR')"#.to_owned(),
        )).await?;

        // Assign permissions to SUPERVISOR
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO rol_permisos (rol_id, permiso_id)
               SELECT r.id_rol, p.id_permiso
               FROM roles r
               CROSS JOIN permisos p
               WHERE r.nombre_rol = 'SUPERVISOR'
               AND (
                   p.modulo IN ('reportes', 'auditoria')
                   OR p.codigo_permiso IN (
                       'assets_view', 'assets_edit', 'inventory_view', 'work_orders_view',
                       'maintenance_view', 'maintenance_plan_view', 'purchases_view', 'quotes_view',
                       'solicitudes_view', 'invoices_view'
                   )
               )
               AND NOT EXISTS (
                   SELECT 1 FROM rol_permisos rp 
                   WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
               )"#.to_owned(),
        )).await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
