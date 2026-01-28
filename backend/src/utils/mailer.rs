use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::authentication::Credentials;
use sea_orm::{DatabaseConnection, EntityTrait, ColumnTrait, QueryFilter};
use crate::entities::configuraciones;

pub async fn send_email(
    db: &DatabaseConnection,
    to: &str,
    subject: &str,
    body: &str,
) -> Result<(), String> {
    // Fetch settings
    let settings = configuraciones::Entity::find().all(db).await
        .map_err(|e| format!("Error DB: {}", e))?;

    let get_val = |key: &str| -> Option<String> {
        settings.iter().find(|s| s.clave == key).map(|s| s.valor.clone())
    };

    let host = get_val("smtp_host").ok_or("SMTP Host no configurado")?;
    let port_str = get_val("smtp_port").unwrap_or("587".to_string());
    let user = get_val("smtp_user").ok_or("SMTP User no configurado")?;
    let pass = get_val("smtp_password").ok_or("SMTP Password no configurado")?;
    let from = get_val("smtp_from_email").unwrap_or(user.clone());

    if host.is_empty() { return Err("SMTP Host vacio".to_string()); }

    let email = Message::builder()
        .from(from.parse().map_err(|_| "Email origen inválido")?)
        .to(to.parse().map_err(|_| "Email destino inválido")?)
        .subject(subject)
        .body(body.to_string())
        .map_err(|e| format!("Error construyendo email: {}", e))?;

    let creds = Credentials::new(user, pass);

    // Build transport. Note: For simple MVP we try relay logic or standard.
    // Lettre AsyncTokio1Executor is needed.
    let mailer = SmtpTransport::relay(&host)
        .map_err(|e| format!("Error relay: {}", e))?
        .credentials(creds)
        .port(port_str.parse().unwrap_or(587))
        .build();

    // Send the email
    match mailer.send(&email) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error enviando email: {}", e)),
    }
}
