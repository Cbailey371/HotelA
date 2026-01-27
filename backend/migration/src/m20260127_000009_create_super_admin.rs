use sea_orm_migration::prelude::*;
use crate::m20220101_000001_create_table::{Usuarios, Roles, RolPermisos, UsuarioRoles};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // Redundant with m20260127_000010_setup_super_admin
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
