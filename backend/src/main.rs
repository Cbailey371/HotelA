mod entities;
mod utils;
mod controllers;
mod middleware;

use axum::{
    routing::{get, post, put, delete},
    Router,
    handler::Handler,
};
use tower_http::services::ServeDir;
use dotenvy::dotenv;
use sea_orm::{Database, DatabaseConnection};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use axum::extract::DefaultBodyLimit;

#[tokio::main]
async fn main() {
    dotenv().ok();
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db: DatabaseConnection = Database::connect(db_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("Connected to database");

    use migration::{Migrator, MigratorTrait};
    Migrator::up(&db, None).await.expect("Failed to run migrations");
    tracing::info!("Migrations applied");

    let shared_state = db.clone();

    // Initialize Cron Scheduler
    if let Err(e) = crate::utils::cron::init_scheduler(db.clone()).await {
        tracing::error!("Failed to initialize scheduler: {:?}", e);
    }

    let app = Router::new()
        .route("/", get(|| async { "HotelA Backend Running" }))
        .route("/api/auth/login", post(controllers::auth::login))
        .route("/api/public/calendar", get(controllers::maintenance::get_public_schedules))

        
        // Rutas protegidas
        .nest("/api", 
            Router::new()
                .route("/assets", 
                    get(controllers::assets::get_assets.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["assets_view", "acceso_portal"]))))
                    .post(controllers::assets::create_asset.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit"))))
                )
                // ASSETS IMPORT ROUTES
                .route("/assets/template/create", get(controllers::assets::get_assets_template_create))
                .route("/assets/template/update", get(controllers::assets::get_assets_template_update))
                .route("/assets/import/create", 
                    post(controllers::assets::import_assets_create.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit"))))
                )
                .route("/assets/import/update", 
                    post(controllers::assets::import_assets_update.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit"))))
                )
                
                .route("/assets/{id}", get(controllers::assets::get_asset_by_id).put(controllers::assets::update_asset).delete(controllers::assets::delete_asset)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit")))
                )
                .route("/assets/{id}/documents", post(controllers::assets::add_asset_document)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit")))
                )
                .route("/assets/documents/{id}", axum::routing::delete(controllers::assets::delete_asset_document)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit")))
                )
                .route("/providers", get(controllers::providers::get_providers)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "providers_view")))
                    .post(controllers::providers::create_provider)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "providers_edit")))
                )
                .route("/providers/{id}", put(controllers::providers::update_provider).delete(controllers::providers::delete_provider)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "providers_edit")))
                )
                .route("/technicians", get(controllers::technicians::get_technicians)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "techs_view")))
                    .post(controllers::technicians::create_technician)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "techs_edit")))
                )
                .route("/technicians/{id}", put(controllers::technicians::update_technician).delete(controllers::technicians::delete_technician)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "techs_edit")))
                )
                .route("/holidays", get(controllers::holidays::get_holidays)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "holidays_view")))
                    .post(controllers::holidays::create_holiday)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "holidays_manage")))
                )
                .route("/holidays/{id}", put(controllers::holidays::update_holiday).delete(controllers::holidays::delete_holiday)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "holidays_manage")))
                )
                .route("/holidays/seed", post(controllers::holidays::seed_holidays)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/inventory/transactions", get(controllers::inventory_transaction::get_transactions)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_history")))
                )
                .route("/inventory", get(controllers::inventory::get_parts).post(controllers::inventory::create_part)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_view")))
                )
                
                // INVENTORY IMPORT ROUTES
                .route("/inventory/template/create", get(controllers::inventory::get_inventory_template_create))
                .route("/inventory/template/update", get(controllers::inventory::get_inventory_template_update))
                .route("/inventory/import/create", post(controllers::inventory::import_inventory_create)
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_edit")))
                )
                .route("/inventory/import/update", post(controllers::inventory::import_inventory_update)
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_edit")))
                )
                .route("/inventory/{id}", get(controllers::inventory::get_part_by_id).put(controllers::inventory::update_part).delete(controllers::inventory::delete_part)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_edit")))
                )
                .route("/inventory/{id}/image", post(controllers::inventory::upload_part_image)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_edit")))
                )
                .route("/inventory/{id}/history", get(controllers::inventory::get_part_history)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_view")))
                )
                .route("/maintenance/pending-schedules", get(controllers::maintenance::get_pending_schedules)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_plan_view")))
                )
                .route("/maintenance/schedule", get(controllers::maintenance::get_schedules)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_plan_view")))
                    .post(controllers::maintenance::create_schedule)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_plan_edit")))
                )
                .route("/maintenance/schedule/{id}", put(controllers::maintenance::update_schedule).delete(controllers::maintenance::delete_schedule)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_plan_edit")))
                )
                .route("/maintenance/schedule/{id}/parts", get(controllers::maintenance::get_maintenance_parts)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_plan_view")))
                    .post(controllers::maintenance::add_maintenance_part)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_plan_edit")))
                )
                .route("/maintenance/schedule/parts/{id}", axum::routing::delete(controllers::maintenance::remove_maintenance_part)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_plan_edit")))
                )
                .route("/maintenance/execute/{id}", post(controllers::maintenance::execute_maintenance)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "maintenance_execute")))
                )
                .route("/maintenance/types", get(controllers::maintenance::get_maintenance_types))
                .route("/audit", get(controllers::audit::get_audit_logs)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/dashboard/stats", get(controllers::dashboard::get_stats)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "acceso_dashboard")))
                )
                // Reports Routes
                .route("/reports/inventory-status", get(controllers::reports::get_inventory_status)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "reports_view")))
                )
                .route("/reports/maintenance-roi", get(controllers::reports::get_maintenance_roi)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "reports_view")))
                )
                .route("/reports/asset-depreciation", get(controllers::reports::get_asset_depreciation)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "reports_view")))
                )
                .route("/reports/generate", post(controllers::reports::generate_report)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "reports_view")))
                )
                .route("/reports/scheduled", get(controllers::reports::get_scheduled_reports)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "reports_view")))
                    .post(controllers::reports::create_scheduled_report)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/reports/scheduled/{id}", delete(controllers::reports::delete_scheduled_report).put(controllers::reports::update_scheduled_report)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/reports/scheduled/{id}/execute", post(controllers::reports::execute_scheduled_report)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                // Payment Terms
                .route("/settings/payment-terms", get(controllers::payment_terms::get_payment_terms).post(controllers::payment_terms::create_payment_term)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/payment-terms/{id}", axum::routing::delete(controllers::payment_terms::delete_payment_term).put(controllers::payment_terms::update_payment_term)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/brands", get(controllers::brands::get_brands).post(controllers::brands::create_brand)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/brands/{id}", axum::routing::delete(controllers::brands::delete_brand).put(controllers::brands::update_brand)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/warehouses", get(controllers::warehouses::get_warehouses).post(controllers::warehouses::create_warehouse)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/warehouses/{id}", put(controllers::warehouses::update_warehouse).delete(controllers::warehouses::delete_warehouse)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/warehouses/{id}/locations", get(controllers::warehouse_locations::get_warehouse_locations).post(controllers::warehouse_locations::create_warehouse_location)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/warehouses/locations/{id}", put(controllers::warehouse_locations::update_warehouse_location).delete(controllers::warehouse_locations::delete_warehouse_location)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/users", get(controllers::user::get_users).post(controllers::user::create_user)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/users/{id}", put(controllers::user::update_user).delete(controllers::user::delete_user)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                
                // Roles & Permissions
                .route("/roles", get(controllers::roles::get_roles).post(controllers::roles::create_role)
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/roles/{id}", put(controllers::roles::update_role).delete(controllers::roles::delete_role)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/permissions", get(controllers::roles::get_permissions))

                 // Purchases
                .route("/purchases/requests", get(controllers::purchases::get_requests).post(controllers::purchases::create_request))
                .route("/purchases/requests/{id}", get(controllers::purchases::get_request_by_id))
                .route("/purchases/requests/{id}/status", put(controllers::purchases::update_request_status)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "purchases_edit")))
                )
                .route("/purchases/orders/from-request/{id}", post(controllers::purchases::create_order_from_request)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "purchases_edit")))
                )
                .route("/purchases/orders/{id}/receive", axum::routing::post(controllers::purchases::receive_order_items)
         .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_edit")))
    )
                .route("/purchases/orders", get(controllers::purchases::get_orders).post(controllers::purchases::create_direct_order)
                     // Allow listing orders for viewers, but creating needs edit
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "purchases_view"))) 
                )
                .route("/purchases/orders/{id}", get(controllers::purchases::get_order_by_id).put(controllers::purchases::update_order).delete(controllers::purchases::delete_order)
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "purchases_view")))
                )
                .route("/purchases/orders/{id}/status", put(controllers::purchases::update_order_status)
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "purchases_edit")))
                )
                .route("/purchases/orders/{id}/send", post(controllers::purchases::send_order_email)
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "purchases_edit")))
                )
                
                // Purchase Invoices
                .route("/purchases/invoices", get(controllers::purchase_invoices::get_invoices)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "invoices_view")))
                    .post(controllers::purchase_invoices::create_invoice)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "invoices_create")))
                )
                .route("/purchases/invoices/{id}", get(controllers::purchase_invoices::get_invoice_by_id)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "invoices_view")))
                    .delete(controllers::purchase_invoices::delete_invoice)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "invoices_delete")))
                    .put(controllers::purchase_invoices::update_invoice)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "invoices_edit")))
                )
                .route("/purchases/invoices/{id}/receive", post(controllers::purchase_invoices::receive_invoice)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "purchases_receive")))
                )

                // Purchase Quotes
                .route("/purchases/quotes", 
                    post(controllers::purchase_quotes::create_quote)
                        .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "quotes_create")))
                    .get(controllers::purchase_quotes::get_quotes)
                        .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "quotes_view")))
                )
                .route("/purchases/quotes/{id}", 
                    get(controllers::purchase_quotes::get_quote_by_id)
                        .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "quotes_view")))
                    .put(controllers::purchase_quotes::update_quote)
                        .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "quotes_edit")))
                    .delete(controllers::purchase_quotes::delete_quote)
                        .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "quotes_delete")))
                )
                .route("/purchases/quotes/{id}/send", 
                    post(controllers::purchase_quotes::send_quote_email)
                        .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "quotes_edit")))
                )
                
                // Work Orders
                .route("/work-orders", 
                    get(controllers::work_orders::get_work_orders.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["work_orders_view", "acceso_portal"]))))
                    .post(controllers::work_orders::create_work_order.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["work_orders_create", "acceso_portal"]))))
                )
                .route("/work-orders/{id}", 
                    get(controllers::work_orders::get_work_order.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["work_orders_view", "acceso_portal"]))))
                    .put(controllers::work_orders::update_work_order.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "work_orders_edit"))))
                    .delete(controllers::work_orders::delete_work_order.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "work_orders_delete"))))
                )
                .route("/work-orders/{id}/status", 
                    put(controllers::work_orders::update_work_order_status.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["work_orders_edit", "acceso_portal"]))))
                )
                .route("/work-orders/{id}/finish", post(controllers::work_orders::finish_work_order)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "work_orders_close")))
                )
                .route("/work-orders/{id}/comments", 
                    get(controllers::work_orders::get_comments.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["work_orders_view", "acceso_portal"]))))
                    .post(controllers::work_orders::add_comment.layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["work_orders_edit", "acceso_portal"]))))
                )
                .route("/work-orders/{id}/send", post(controllers::work_orders::send_work_order_email)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "work_orders_edit")))
                )
                
                // Notifications
                .route("/notifications/alerts", get(controllers::notifications::get_alerts))
                


                .route("/upload/manual", post(controllers::upload::upload_manual)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/upload/image", post(controllers::upload::upload_image)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_any_permission(state, req, next, ["admin_access", "work_orders_edit", "acceso_portal"])))
                )
                
                // Settings
                .route("/settings/smtp", get(controllers::settings::get_smtp_settings).post(controllers::settings::save_smtp_settings)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/smtp/test", post(controllers::settings::test_smtp_connection)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/settings/company", get(controllers::settings::get_company_settings).post(controllers::settings::save_company_settings)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                
                // Backup & Restore
                .route("/backup/export", get(controllers::backup::export_backup)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/backup/import", post(controllers::backup::import_backup)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                
                // Asset Configuration
                .nest("/asset-config", 
                    Router::new()
                        .route("/categories", get(controllers::asset_config::get_categories))
                        .route("/types", get(controllers::asset_config::get_types))
                        .route("/locations", get(controllers::asset_config::get_locations))
                        .route("/maintenance-tasks", get(controllers::asset_config::get_maintenance_tasks))
                        .merge(
                            Router::new()
                                .route("/categories", post(controllers::asset_config::create_category))
                                .route("/categories/{id}", delete(controllers::asset_config::delete_category).put(controllers::asset_config::update_category))
                                .route("/types", post(controllers::asset_config::create_type))
                                .route("/types/{id}", delete(controllers::asset_config::delete_type).put(controllers::asset_config::update_type))
                                .route("/locations", post(controllers::asset_config::create_location))
                                .route("/locations/{id}", delete(controllers::asset_config::delete_location).put(controllers::asset_config::update_location))
                                .route("/maintenance-tasks", post(controllers::asset_config::create_maintenance_task))
                                .route("/maintenance-tasks/{id}", delete(controllers::asset_config::delete_maintenance_task).put(controllers::asset_config::update_maintenance_task))
                                .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                        )
                )

                .layer(axum::middleware::from_fn_with_state(shared_state.clone(), middleware::auth::auth_middleware))
        )
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024)); // 50MB Limit
    let allowed_origins_raw = std::env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:5173,http://127.0.0.1:5173".into());
    
    let allowed_origins: Vec<axum::http::HeaderValue> = allowed_origins_raw
        .split(',')
        .map(|s| s.trim().parse().unwrap())
        .collect();

    let app = app
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin(allowed_origins)
                .allow_methods([axum::http::Method::GET, axum::http::Method::POST, axum::http::Method::PUT, axum::http::Method::DELETE, axum::http::Method::OPTIONS])
                .allow_credentials(true)
                .allow_headers([
                    axum::http::header::AUTHORIZATION, 
                    axum::http::header::CONTENT_TYPE,
                    axum::http::header::ACCEPT,
                    axum::http::header::ORIGIN,
                ])
                .expose_headers([
                    axum::http::header::CONTENT_DISPOSITION,
                ])
        )
        .with_state(db);

    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".into());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".into());
    let addr: SocketAddr = format!("{}:{}", host, port).parse().expect("Invalid address");

    tracing::info!("Listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
