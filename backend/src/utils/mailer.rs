use lettre::{Message, SmtpTransport, Transport, message::{header, MultiPart, SinglePart}};
use lettre::transport::smtp::authentication::Credentials;
use sea_orm::{DatabaseConnection, EntityTrait};
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

    let mut email_builder = Message::builder()
        .from(from.parse().map_err(|_| "Email origen inválido")?)
        .subject(subject);

    for recipient in to.split(',') {
        let recipient_clean = recipient.trim();
        if !recipient_clean.is_empty() {
            email_builder = email_builder.to(recipient_clean.parse().map_err(|_| "Email destino inválido")?);
        }
    }

    let email = email_builder
        .body(body.to_string())
        .map_err(|e| format!("Error construyendo email: {}", e))?;

    let creds = Credentials::new(user, pass);

    // Build transport. Note: For simple MVP we try relay logic or standard.
    // Lettre AsyncTokio1Executor is needed.
    let mailer = SmtpTransport::starttls_relay(&host)
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

pub async fn send_email_with_attachment(
    db: &DatabaseConnection,
    to: &str,
    subject: &str,
    body: &str,
    attachment_name: &str,
    attachment_data: Vec<u8>,
    content_type: &str,
) -> Result<(), String> {
    // Fetch settings code is duplicated, refactor ideally but copy for now
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

    let mut email_builder = Message::builder()
        .from(from.parse().map_err(|_| "Email origen inválido")?)
        .subject(subject);

    for recipient in to.split(',') {
        let recipient_clean = recipient.trim();
        if !recipient_clean.is_empty() {
            email_builder = email_builder.to(recipient_clean.parse().map_err(|_| "Email destino inválido")?);
        }
    }

    let email = email_builder
        .multipart(
            MultiPart::mixed()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(body.to_string())
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::parse(content_type).unwrap_or(header::ContentType::TEXT_PLAIN))
                        .header(header::ContentDisposition::attachment(attachment_name))
                        .body(attachment_data)
                )
        )
        .map_err(|e| format!("Error construyendo email: {}", e))?;

    let creds = Credentials::new(user, pass);

    let mailer = SmtpTransport::starttls_relay(&host)
        .map_err(|e| format!("Error relay: {}", e))?
        .credentials(creds)
        .port(port_str.parse().unwrap_or(587))
        .build();

    match mailer.send(&email) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error enviando email: {}", e)),
    }
}
