use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey, errors::Error};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // username
    pub exp: usize,
    pub user_id: i32,
    pub role: String,
}

pub fn generate_jwt(user_id: i32, username: String, role: String) -> String {
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: username,
        exp: expiration as usize,
        user_id,
        role,
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret_desarrollo_muy_largo_y_seguro_123".to_string());
    encode(
        &Header::default(), 
        &claims, 
        &EncodingKey::from_secret(secret.as_bytes())
    ).unwrap_or_default()
}

pub fn decode_jwt(token: &str) -> Result<Claims, Error> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret_desarrollo_muy_largo_y_seguro_123".to_string());
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(token_data.claims)
}
