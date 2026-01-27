mod entities;
mod utils;
mod controllers;
mod middleware;

use axum::{
    routing::{get, post, put},
    Router,
};
use tower_http::services::ServeDir;
use dotenvy::dotenv;
use sea_orm::{Database, DatabaseConnection};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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

    let app = Router::new()
        .route("/", get(|| async { "HotelA Backend Running" }))
        .route("/api/auth/login", post(controllers::auth::login))
        
        // Rutas protegidas
        .nest("/api", 
            Router::new()
                .route("/assets", post(controllers::assets::create_asset)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit")))
                    .get(controllers::assets::get_assets)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_view")))
                )
                .route("/assets/template", get(controllers::assets::get_assets_template))
                .route("/assets/import", post(controllers::assets::import_assets_csv)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit")))
                )
                .route("/assets/{id}", get(controllers::assets::get_asset_by_id).put(controllers::assets::update_asset).delete(controllers::assets::delete_asset)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "assets_edit")))
                )
                .route("/providers", get(controllers::providers::get_providers).post(controllers::providers::create_provider))
                .route("/providers/{id}", put(controllers::providers::update_provider).delete(controllers::providers::delete_provider))
                .route("/technicians", get(controllers::technicians::get_technicians).post(controllers::technicians::create_technician))
                .route("/technicians/{id}", put(controllers::technicians::update_technician).delete(controllers::technicians::delete_technician))
                .route("/inventory", get(controllers::inventory::get_parts).post(controllers::inventory::create_part)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_view")))
                )
                .route("/inventory/template", get(controllers::inventory::get_inventory_template))
                .route("/inventory/import", post(controllers::inventory::import_inventory_csv)
                     .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_edit")))
                )
                .route("/inventory/{id}", put(controllers::inventory::update_part).delete(controllers::inventory::delete_part)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "inventory_edit")))
                )
                .route("/maintenance/schedule", get(controllers::maintenance::get_schedules).post(controllers::maintenance::create_schedule))
                .route("/maintenance/execute/{id}", post(controllers::maintenance::execute_maintenance))
                .route("/maintenance/types", get(controllers::maintenance::get_maintenance_types))
                .route("/audit", get(controllers::audit::get_audit_logs)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                .route("/dashboard/stats", get(controllers::dashboard::get_stats))
                .route("/reports/assets", get(controllers::reports::generate_assets_report))
                .route("/users", get(controllers::user::get_users).post(controllers::user::create_user)
                    .layer(axum::middleware::from_fn_with_state(db.clone(), |state, req, next| middleware::auth::require_permission(state, req, next, "admin_access")))
                )
                
                // Work Orders
                .route("/work-orders", get(controllers::work_orders::get_work_orders).post(controllers::work_orders::create_work_order))
                .route("/work-orders/{id}/status", put(controllers::work_orders::update_work_order_status))

                // Purchases
                .route("/purchases", post(controllers::purchases::create_purchase_order).get(controllers::purchases::get_purchases))

                .route("/upload/manual", post(controllers::upload::upload_manual))
                .route("/upload", post(controllers::upload::upload_image))
                .layer(axum::middleware::from_fn_with_state(shared_state.clone(), middleware::auth::auth_middleware))
        )
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods([axum::http::Method::GET, axum::http::Method::POST, axum::http::Method::PUT, axum::http::Method::DELETE, axum::http::Method::OPTIONS])
                .allow_headers([
                    axum::http::header::AUTHORIZATION, 
                    axum::http::header::CONTENT_TYPE,
                    axum::http::header::ACCEPT,
                    axum::http::header::ORIGIN,
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
