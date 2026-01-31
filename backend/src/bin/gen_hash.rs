use argon2::{
    password_hash::{
        rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2,
};

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        println!("Uso: cargo run --bin gen_hash <password>");
        return;
    }
    
    let password = &args[1];
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    match argon2.hash_password(password.as_bytes(), &salt) {
        Ok(h) => println!("\nHash generado con éxito:\n\n{}\n", h),
        Err(e) => println!("Error al generar hash: {}", e),
    }
}
