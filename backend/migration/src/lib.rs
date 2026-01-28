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
mod m20260128_001301_add_codigo_administrativo_to_assets;
mod m20260128_002201_seed_super_admin_and_more_permissions;
mod m20260128_003307_assign_super_admin_to_user_1;
mod m20260128_004143_repair_rbac_data;
mod m20260128_010641_create_settings_table;
mod m20260128_203000_create_asset_config_tables;
mod m20260128_204500_create_locations_table;
mod m20260128_220000_create_asset_documents_table;
mod m20260128_221000_fix_historial_columns;
mod m20260128_223000_create_maintenance_tasks_table;
mod m20260128_224000_add_task_type_to_maintenance;
mod m20260128_230000_refine_maintenance_scheduling;
mod m20260128_233000_seed_maintenance_types;
mod m20260128_234500_link_ot_to_maintenance;
mod m20260129_000000_create_maintenance_parts;
mod m20260130_000000_add_image_to_parts;
mod m20260128_155231_create_company_config;



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
            Box::new(m20260128_001301_add_codigo_administrativo_to_assets::Migration),
            Box::new(m20260128_002201_seed_super_admin_and_more_permissions::Migration),
            Box::new(m20260128_003307_assign_super_admin_to_user_1::Migration),
            Box::new(m20260128_004143_repair_rbac_data::Migration),
            Box::new(m20260128_010641_create_settings_table::Migration),
            Box::new(m20260128_203000_create_asset_config_tables::Migration),
            Box::new(m20260128_204500_create_locations_table::Migration),
            Box::new(m20260128_220000_create_asset_documents_table::Migration),
            Box::new(m20260128_221000_fix_historial_columns::Migration),
            Box::new(m20260128_223000_create_maintenance_tasks_table::Migration),
            Box::new(m20260128_224000_add_task_type_to_maintenance::Migration),
            Box::new(m20260128_230000_refine_maintenance_scheduling::Migration),
            Box::new(m20260128_233000_seed_maintenance_types::Migration),
            Box::new(m20260128_234500_link_ot_to_maintenance::Migration),
            Box::new(m20260129_000000_create_maintenance_parts::Migration),
            Box::new(m20260130_000000_add_image_to_parts::Migration),
            Box::new(m20260128_155231_create_company_config::Migration),
        ]
    }
}
