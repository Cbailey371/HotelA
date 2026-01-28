use sea_orm::{Database, DatabaseConnection, EntityTrait, ColumnTrait, QueryFilter, Set, ActiveModelTrait};
use dotenvy::dotenv;

#[path = "../entities/mod.rs"]
mod entities;
#[path = "../utils/hash.rs"]
mod hash;

use entities::usuarios;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db: DatabaseConnection = Database::connect(db_url).await.expect("Failed to connect to DB");

    let username = "admin";
    let new_password = "admin";

    let user_opt = usuarios::Entity::find()
        .filter(usuarios::Column::Usuario.eq(username))
        .one(&db)
        .await
        .expect("Failed to query user");

    if let Some(user) = user_opt {
        let mut active_user: usuarios::ActiveModel = user.into();
        let hashed = hash::hash_password(new_password).expect("Hashing failed");
        
        active_user.password_hash = Set(hashed);
        active_user.update(&db).await.expect("Failed to update user");
        
        println!("Password for user '{}' has been reset to '{}'", username, new_password);
    } else {
        println!("User '{}' not found!", username); 
    }
}
