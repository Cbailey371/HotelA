use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::{Statement, ConnectionTrait, DatabaseBackend};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // 1. Insert Permissions
        // We use ON CONFLICT DO NOTHING (or similar logic) to avoid errors if re-run, 
        // but since this is a migration, we assume unique constraint on code?
        // Let's use simple inserts. If they fail, migration fails (good).
        
        // Data to insert
        let perms = vec![
            ("quotes_view", "Ver cotizaciones", "compras"),
            ("quotes_create", "Crear cotizaciones", "compras"),
            ("quotes_edit", "Editar cotizaciones", "compras"),
            ("quotes_delete", "Eliminar cotizaciones", "compras"),
        ];

        for (code, desc, module) in perms {
            let sql = format!(
                "INSERT INTO permisos (codigo_permiso, descripcion, modulo) \
                 SELECT '{}', '{}', '{}' \
                 WHERE NOT EXISTS (SELECT 1 FROM permisos WHERE codigo_permiso = '{}');",
                code, desc, module, code
            );
            db.execute(Statement::from_string(DatabaseBackend::Postgres, sql)).await?;
        }

        // 2. Assign to Admin (1) and Super Admin (2)
        // We link these 4 permissions to roles 1 and 2.
        let codes_str = "'quotes_view', 'quotes_create', 'quotes_edit', 'quotes_delete'";
        
        let roles = vec![1, 2];
        for role_id in roles {
             let sql_link = format!(
                "INSERT INTO rol_permisos (rol_id, permiso_id) \
                 SELECT {}, id_permiso FROM permisos \
                 WHERE codigo_permiso IN ({}) \
                 AND NOT EXISTS ( \
                    SELECT 1 FROM rol_permisos rp \
                    WHERE rp.rol_id = {} AND rp.permiso_id = permisos.id_permiso \
                 );",
                 role_id, codes_str, role_id
            );
            db.execute(Statement::from_string(DatabaseBackend::Postgres, sql_link)).await?;
        }

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Optional: delete them
        let db = manager.get_connection();
        let codes_str = "'quotes_view', 'quotes_create', 'quotes_edit', 'quotes_delete'";
        
        let sql = format!("DELETE FROM permisos WHERE codigo_permiso IN ({});", codes_str);
        db.execute(Statement::from_string(DatabaseBackend::Postgres, sql)).await?;
        
        Ok(())
    }
}
