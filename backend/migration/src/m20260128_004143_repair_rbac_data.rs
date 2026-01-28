use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
         let db = manager.get_connection();
         let backend = manager.get_database_backend();

         // 1. Ensure SUPER-ADMIN role exists
         db.execute(Statement::from_string(
             backend,
             r#"INSERT INTO roles (nombre_rol, descripcion, estado) 
                SELECT 'SUPER-ADMIN', 'Acceso total y absoluto al sistema', 'activo'
                WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'SUPER-ADMIN')"#.to_owned(),
         )).await?;

         // 2. Ensure Permissions exist (Insert ignoring duplicates if possible, or using NOT EXISTS)
         let perms = vec![
             ("roles_view", "Ver roles y permisos", "seguridad"),
             ("roles_edit", "Crear y editar roles", "seguridad"),
             ("work_orders_view", "Ver órdenes de trabajo", "mantenimiento"),
             ("work_orders_edit", "Editar órdenes de trabajo", "mantenimiento"),
             ("inventory_view", "Ver inventario", "inventario"),
             ("inventory_edit", "Editar inventario", "inventario"),
             ("purchases_view", "Ver compras", "compras"),
             ("purchases_edit", "Editar compras", "compras"),
             ("assets_view", "Ver activos", "activos"),
             ("assets_edit", "Editar activos", "activos"),
             ("admin_access", "Acceso Administrativo Global", "admin"),
         ];

         for (code, desc, mo) in perms {
             db.execute(Statement::from_string(backend, format!(
                 r#"INSERT INTO permisos (codigo_permiso, descripcion, modulo) 
                    SELECT '{}', '{}', '{}' 
                    WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo_permiso = '{}')"#,
                 code, desc, mo, code
             ))).await?;
         }

         // 3. Link Permissions to SUPER-ADMIN
         db.execute(Statement::from_string(
             backend,
             r#"INSERT INTO rol_permisos (rol_id, permiso_id)
                SELECT r.id_rol, p.id_permiso
                FROM roles r, permisos p
                WHERE r.nombre_rol = 'SUPER-ADMIN'
                AND NOT EXISTS (
                    SELECT 1 FROM rol_permisos rp 
                    WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
                )"#.to_owned(),
         )).await?;

         // 4. Update User 1 Code if missing
         db.execute(Statement::from_string(
             backend,
             r#"UPDATE usuarios SET codigo_usuario = 'USR-001' 
                WHERE id_usuario = 1 AND (codigo_usuario IS NULL OR codigo_usuario = '')"#.to_owned(),
         )).await?;

         // 5. Assign SUPER-ADMIN to User 1
         db.execute(Statement::from_string(
             backend,
             r#"INSERT INTO usuario_roles (usuario_id, rol_id)
                SELECT 1, r.id_rol
                FROM roles r
                WHERE r.nombre_rol = 'SUPER-ADMIN'
                AND NOT EXISTS (
                    SELECT 1 FROM usuario_roles ur 
                    WHERE ur.usuario_id = 1 AND ur.rol_id = r.id_rol
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
