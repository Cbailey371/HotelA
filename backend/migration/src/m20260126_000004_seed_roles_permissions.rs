use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // 1. Ensure Role "ADMINISTRADOR" exists
        // (Assuming ID 1 is free or created in first migration, but let's be safe)
        // We'll use IDs from create_table migration if possible, or just insert.
        
        manager.exec_stmt(
            Query::insert()
                .into_table(Roles::Table)
                .columns([Roles::NombreRol, Roles::Descripcion])
                .values_panic(["ADMINISTRADOR".into(), "Acceso total al sistema".into()])
                .values_panic(["TECNICO".into(), "Acceso limitado a mantenimientos".into()])
                .to_owned()
        ).await?;

        // 2. Insert Permissions
        manager.exec_stmt(
            Query::insert()
                .into_table(Permisos::Table)
                .columns([Permisos::CodigoPermiso, Permisos::Descripcion, Permisos::Modulo])
                .values_panic(["assets_view".into(), "Ver activos".into(), "activos".into()])
                .values_panic(["assets_edit".into(), "Editar activos".into(), "activos".into()])
                .values_panic(["providers_view".into(), "Ver proveedores".into(), "proveedores".into()])
                .values_panic(["providers_edit".into(), "Editar proveedores".into(), "proveedores".into()])
                .values_panic(["techs_view".into(), "Ver técnicos".into(), "técnicos".into()])
                .values_panic(["techs_edit".into(), "Editar técnicos".into(), "técnicos".into()])
                .values_panic(["users_admin".into(), "Administrar usuarios".into(), "seguridad".into()])
                .to_owned()
        ).await?;

        // 3. Link Admin (ID 1) to all permissions
        // Note: This assumes serial IDs starting at 1.
        for i in 1..=7 {
            manager.exec_stmt(
                Query::insert()
                    .into_table(RolPermisos::Table)
                    .columns([RolPermisos::RolId, RolPermisos::PermisoId])
                    .values_panic([1.into(), i.into()])
                    .to_owned()
            ).await?;
        }

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Just truncate or do nothing, typically seeds aren't fully reverted with drop
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Roles { Table, NombreRol, Descripcion }
#[derive(DeriveIden)]
enum Permisos { Table, CodigoPermiso, Descripcion, Modulo }
#[derive(DeriveIden)]
enum RolPermisos { Table, RolId, PermisoId }
