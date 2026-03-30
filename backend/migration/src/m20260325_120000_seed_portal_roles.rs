use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        // 1. Insert New Roles
        manager.exec_stmt(
            Query::insert()
                .into_table(Roles::Table)
                .columns([Roles::NombreRol, Roles::Descripcion])
                .values_panic(["LIMPIEZA".into(), "Personal de limpieza con acceso al portal de reportes".into()])
                .values_panic(["RECEPCION".into(), "Personal de recepción con acceso al portal de reportes".into()])
                .values_panic(["SOLICITANTE".into(), "Usuario general que puede solicitar mantenimientos".into()])
                .to_owned()
        ).await?;

        // 2. Link roles to basic permissions (assets_view)
        // This allows them to search for locations (which are often linked to assets or stored in assets table)
        // if the search logic requires assets_view permission.
        
        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO rol_permisos (rol_id, permiso_id)
            SELECT r.id_rol, p.id_permiso
            FROM roles r, permisos p
            WHERE r.nombre_rol IN ('LIMPIEZA', 'RECEPCION', 'SOLICITANTE')
            AND p.codigo_permiso = 'assets_view'
            AND NOT EXISTS (
                SELECT 1 FROM rol_permisos WHERE rol_id = r.id_rol AND permiso_id = p.id_permiso
            )
            "#
        )).await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // Typically we don't remove seeded roles on rollback unless strictly necessary
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Roles { Table, NombreRol, Descripcion }

#[derive(DeriveIden)]
enum Permisos { Table, CodigoPermiso }

#[derive(DeriveIden)]
enum RolPermisos { Table, RolId, PermisoId }
