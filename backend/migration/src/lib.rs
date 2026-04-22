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
mod m20260129_023412_add_inventory_fields;
mod m20260129_024647_create_purchases_and_inventory;

mod m20260129_000001_add_provider_fields;
mod m20260129_030000_add_dv_to_providers;
mod m20260130_033500_add_fields_to_purchase_order;
mod m20260130_040000_create_payment_terms;
mod m20260130_041000_add_fields_to_work_order;
mod m20260130_050000_create_brands_and_warehouses;
mod m20260130_060000_create_warehouse_locations;
mod m20260130_070000_add_received_quantity;
mod m20260129_083649_create_scheduled_reports_table;
mod m20260129_152408_add_scheduling_fields_to_reports;
mod m20260131_090000_fix_admin_password;
mod m20260131_114000_seed_new_modules_permissions;
pub mod m20260211_170000_field_permissions;
pub mod m20260211_180000_fix_field_permissions_module;
mod m20260211_200000_create_purchase_invoices;
mod m20260207_120000_link_maintenance_to_ot;
mod m20260207_233929_create_feriados_pa_table;
mod m20260207_235500_seed_holidays_permissions;
mod m20260212_012712_flexibilize_purchase_invoices;
mod m20260212_999999_reset_admin_password;
mod m20260212_044302_create_purchase_quotes;
mod m20260212_044420_seed_quotes_permissions;
mod m20260212_200000_add_sku_and_part_assets;
mod m20260213_000000_update_rbac_v2;
mod m20260310_020021_add_garantia_to_activos;
mod m20260324_000013_update_work_orders;
mod m20260324_000014_create_work_order_comments;
mod m20260325_103600_add_asunto_to_work_orders;
mod m20260325_110000_add_foto_dano_to_work_orders;
mod m20260325_120000_seed_portal_roles;
mod m20260325_130000_add_id_usuario_to_work_orders;
mod m20260325_133000_add_portal_access_permission;
mod m20260325_143000_add_work_orders_history_permission;
mod m20260326_163000_add_homologacion_permissions;
mod m20260330_110000_add_dashboard_permission;
mod m20260330_120000_cleanup_recepcion_permissions;
mod m20260330_130000_fix_roles_and_user_assignments;
mod m20260420_000000_add_asunto_mantenimiento;
mod m20260421_142417_add_componentes_estandar_table;
mod m20260422_000000_create_activo_componentes_table;

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
            Box::new(m20260129_023412_add_inventory_fields::Migration),
            Box::new(m20260129_024647_create_purchases_and_inventory::Migration),
            Box::new(m20260129_000001_add_provider_fields::Migration),
            Box::new(m20260129_030000_add_dv_to_providers::Migration),
            Box::new(m20260130_033500_add_fields_to_purchase_order::Migration),
            Box::new(m20260130_040000_create_payment_terms::Migration),
            Box::new(m20260130_041000_add_fields_to_work_order::Migration),
            Box::new(m20260130_050000_create_brands_and_warehouses::Migration),
            Box::new(m20260130_060000_create_warehouse_locations::Migration),
            Box::new(m20260130_070000_add_received_quantity::Migration),
            Box::new(m20260129_083649_create_scheduled_reports_table::Migration),
            Box::new(m20260129_152408_add_scheduling_fields_to_reports::Migration),
            Box::new(m20260131_090000_fix_admin_password::Migration),
            Box::new(m20260131_114000_seed_new_modules_permissions::Migration),
            Box::new(m20260211_170000_field_permissions::Migration),
            Box::new(m20260211_180000_fix_field_permissions_module::Migration),
            Box::new(m20260211_200000_create_purchase_invoices::Migration),
            Box::new(m20260207_120000_link_maintenance_to_ot::Migration),
            Box::new(m20260207_233929_create_feriados_pa_table::Migration),
            Box::new(m20260207_235500_seed_holidays_permissions::Migration),
            Box::new(m20260212_012712_flexibilize_purchase_invoices::Migration),
            Box::new(m20260212_999999_reset_admin_password::Migration),
            Box::new(m20260212_044302_create_purchase_quotes::Migration),
            Box::new(m20260212_044420_seed_quotes_permissions::Migration),
            Box::new(m20260212_200000_add_sku_and_part_assets::Migration),
            Box::new(m20260213_000000_update_rbac_v2::Migration),
            Box::new(m20260310_020021_add_garantia_to_activos::Migration),
            Box::new(m20260324_000013_update_work_orders::Migration),
            Box::new(m20260324_000014_create_work_order_comments::Migration),
            Box::new(m20260325_103600_add_asunto_to_work_orders::Migration),
            Box::new(m20260325_110000_add_foto_dano_to_work_orders::Migration),
            Box::new(m20260325_120000_seed_portal_roles::Migration),
            Box::new(m20260325_130000_add_id_usuario_to_work_orders::Migration),
            Box::new(m20260325_133000_add_portal_access_permission::Migration),
            Box::new(m20260325_143000_add_work_orders_history_permission::Migration),
            Box::new(m20260326_163000_add_homologacion_permissions::Migration),
            Box::new(m20260330_110000_add_dashboard_permission::Migration),
            Box::new(m20260330_120000_cleanup_recepcion_permissions::Migration),
            Box::new(m20260330_130000_fix_roles_and_user_assignments::Migration),
            Box::new(m20260420_000000_add_asunto_mantenimiento::Migration),
            Box::new(m20260421_142417_add_componentes_estandar_table::Migration),
            Box::new(m20260422_000000_create_activo_componentes_table::Migration),
        ]
    }
}

