use axum::{routing::get, Router};
fn main() { let _ = Router::<()>::new().route("/users/{id}", get(|| async { "hi" })); }
