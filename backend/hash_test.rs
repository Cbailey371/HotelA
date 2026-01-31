use argon2::{
    password_hash::{
        rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2,
};

fn main() {
    let password = "admin";
    let salt = SaltString::from_b64("Y2J0ZWNoY29uc3VsdGluZw").unwrap();
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .unwrap()
        .to_string();
    println!("Password: {}, Hash: {}", password, password_hash);
    
    let password_123 = "admin123";
    let password_hash_123 = argon2
        .hash_password(password_123.as_bytes(), &salt)
        .unwrap()
        .to_string();
    println!("Password: {}, Hash: {}", password_123, password_hash_123);
}
