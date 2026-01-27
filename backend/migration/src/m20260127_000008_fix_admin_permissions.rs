use sea_orm_migration::prelude::*;
use crate::m20220101_000001_create_table::{Usuarios, Roles, Permisos, RolPermisos, UsuarioRoles};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // 1. Insert admin_access permission if not exists
        db.execute_unprepared(
            "INSERT INTO permisos (codigo_permiso, descripcion, modulo)
             SELECT 'admin_access', 'Acceso total administrativo', 'seguridad'
             WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo_permiso = 'admin_access')"
        ).await?;

        // 2. Link admin_access to Role ADMINISTRADOR
        db.execute_unprepared(
            "INSERT INTO rol_permisos (rol_id, permiso_id)
             SELECT r.id_rol, p.id_permiso 
             FROM roles r, permisos p 
             WHERE r.nombre_rol = 'ADMINISTRADOR' AND p.codigo_permiso = 'admin_access'
             AND NOT EXISTS (
                 SELECT 1 FROM rol_permisos rp 
                 WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
             )"
        ).await?;

        // 3. Create default admin user if not exists
        let password_hash = "$2b$12$76.m6W7q7e8p7.XlS7F/5O6q6W7q7e8p7.XlS7F/5O6q6W7q7e8p7"; 
        db.execute_unprepared(&format!(
            "INSERT INTO usuarios (nombre, apellido, email, usuario, password_hash, cargo, estado)
             SELECT 'Admin', 'Sistemas', 'admin@hotela.com', 'admin', '{}', 'Administrador', 'activo'
             WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE usuario = 'admin')",
            password_hash
        )).await?;

        // 4. Link admin user to Role ADMINISTRADOR
        db.execute_unprepared(
            "INSERT INTO usuario_roles (usuario_id, rol_id)
             SELECT u.id_usuario, r.id_rol 
             FROM usuarios u, roles r 
             WHERE u.usuario = 'admin' AND r.nombre_rol = 'ADMINISTRADOR'
             AND NOT EXISTS (
                 SELECT 1 FROM usuario_roles ur 
                 JOIN usuarios utmp ON ur.usuario_id = utmp.id_usuario
                 JOIN roles rtmp ON ur.rol_id = rtmp.id_rol
                 WHERE utmp.usuario = 'admin' AND rtmp.nombre_rol = 'ADMINISTRADOR'
             )"
        ).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
