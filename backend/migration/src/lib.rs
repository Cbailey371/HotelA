pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20260126_000002_add_image_url;
mod m20260126_000003_create_tecnicos;
mod m20260126_000004_seed_roles_permissions;
mod m20260127_000005_extend_assets;
mod m20260127_000006_extend_maintenance_plan;
mod m20260127_000007_create_work_orders;
mod m20260127_185042_add_global_codes;
mod m20260127_000008_fix_admin_permissions;
mod m20260127_000009_create_super_admin;
mod m20260127_000010_setup_super_admin;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20260126_000002_add_image_url::Migration),
            Box::new(m20260126_000003_create_tecnicos::Migration),
            Box::new(m20260126_000004_seed_roles_permissions::Migration),
            Box::new(m20260127_000005_extend_assets::Migration),
            Box::new(m20260127_000006_extend_maintenance_plan::Migration),
            Box::new(m20260127_000007_create_work_orders::Migration),
            Box::new(m20260127_185042_add_global_codes::Migration),
            Box::new(m20260127_000008_fix_admin_permissions::Migration),
            Box::new(m20260127_000009_create_super_admin::Migration),
            Box::new(m20260127_000010_setup_super_admin::Migration),
        ]
    }
}
