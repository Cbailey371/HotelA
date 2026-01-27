use sea_orm_migration::prelude::*;
use crate::m20220101_000001_create_table::{Usuarios, Roles, Permisos, RolPermisos, UsuarioRoles};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // 1. Ensure SUPER-ADMIN role exists
        db.execute_unprepared(
            "INSERT INTO roles (nombre_rol, descripcion)
             SELECT 'SUPER-ADMIN', 'Acceso total supremo al sistema'
             WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'SUPER-ADMIN')"
        ).await?;

        // 2. Grant ALL permissions to SUPER-ADMIN
        db.execute_unprepared(
            "INSERT INTO rol_permisos (rol_id, permiso_id)
             SELECT r.id_rol, p.id_permiso 
             FROM roles r, permisos p 
             WHERE r.nombre_rol = 'SUPER-ADMIN'
             AND NOT EXISTS (
                 SELECT 1 FROM rol_permisos rp 
                 WHERE rp.rol_id = r.id_rol AND rp.permiso_id = p.id_permiso
             )"
        ).await?;

        // 3. Find user 'admin' and link to SUPER-ADMIN
        db.execute_unprepared(
            "INSERT INTO usuario_roles (usuario_id, rol_id)
             SELECT u.id_usuario, r.id_rol 
             FROM usuarios u, roles r 
             WHERE u.usuario = 'admin' AND r.nombre_rol = 'SUPER-ADMIN'
             AND NOT EXISTS (
                 SELECT 1 FROM usuario_roles ur 
                 JOIN usuarios utmp ON ur.usuario_id = utmp.id_usuario
                 JOIN roles rtmp ON ur.rol_id = rtmp.id_rol
                 WHERE utmp.usuario = 'admin' AND rtmp.nombre_rol = 'SUPER-ADMIN'
             )"
        ).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
