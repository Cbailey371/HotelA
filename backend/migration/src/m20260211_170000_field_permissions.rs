use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::Statement;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Insert the new permission
        manager.exec_stmt(
            Query::insert()
                .into_table(Permisos::Table)
                .columns([Permisos::CodigoPermiso, Permisos::Descripcion, Permisos::Modulo])
                .values_panic(["critical_fields_edit".into(), "Editar campos críticos (Stock, Precio, Estado)".into(), "general".into()])
                .to_owned()
        ).await?;

        // 2. Link it to ADMINISTRADOR (Role ID 1)
        let db = manager.get_connection();
        let backend = manager.get_database_backend();
        
        db.execute(Statement::from_string(
            backend,
            r#"
            INSERT INTO rol_permisos (rol_id, permiso_id)
            SELECT 1, id_permiso
            FROM permisos
            WHERE codigo_permiso = 'critical_fields_edit'
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
