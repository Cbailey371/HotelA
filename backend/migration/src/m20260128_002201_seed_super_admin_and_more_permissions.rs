use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_query::*;
use sea_orm_migration::sea_orm::Statement; // Explicit import
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        // 1. Insert SUPER-ADMIN Role
        // Check if exists first? Or just insert (might fail if unique constraint). 
        // Assuming clean state or handling error is acceptable for seed.
        // But better to use "INSERT INTO ... VALUES ... ON CONFLICT DO NOTHING" if supported, but standard SQL doesn't allow it easily across all.
        // We'll just insert. If it fails, the migration fails (which is fine if already applied).
        
        // Note: We use execute_unprepared for simple queries if possible, or execute with Statement.
        
        // Roles
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO roles (nombre_rol, descripcion) VALUES ('SUPER-ADMIN', 'Acceso total y absoluto al sistema')"#.to_owned(),
        )).await?;

        // 2. Permissions
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO permisos (codigo_permiso, descripcion, modulo) VALUES 
                ('roles_view', 'Ver roles y permisos', 'seguridad'),
                ('roles_edit', 'Crear y editar roles', 'seguridad'),
                ('work_orders_view', 'Ver órdenes de trabajo', 'mantenimiento'),
                ('work_orders_edit', 'Editar órdenes de trabajo', 'mantenimiento'),
                ('inventory_view', 'Ver inventario', 'inventario'),
                ('inventory_edit', 'Editar inventario', 'inventario'),
                ('purchases_view', 'Ver compras', 'compras'),
                ('purchases_edit', 'Editar compras', 'compras')"#.to_owned(),
        )).await?;

        // 3. Link All Permissions to SUPER-ADMIN
        // Using generic INSERT INTO ... SELECT syntax which works on Postgres, MySQL, and SQLite.
        db.execute(Statement::from_string(
            backend,
            r#"INSERT INTO rol_permisos (rol_id, permiso_id) 
               SELECT r.id_rol, p.id_permiso 
               FROM roles r 
               CROSS JOIN permisos p 
               WHERE r.nombre_rol = 'SUPER-ADMIN'"#.to_owned(),
        )).await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}


#[derive(DeriveIden)]
enum Roles {
    Table,
    IdRol,
    NombreRol,
    Descripcion,
}

#[derive(DeriveIden)]
enum Permisos {
    Table,
    IdPermiso,
    CodigoPermiso,
    Descripcion,
    Modulo,
}

#[derive(DeriveIden)]
enum RolPermisos {
    Table,
    RolId,
    PermisoId,
}
