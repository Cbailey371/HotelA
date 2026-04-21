use axum::{
    body::Body,
    http::{Request, StatusCode, header},
    middleware::Next,
    response::Response,
    extract::State,
};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, JoinType, RelationTrait, QuerySelect, PaginatorTrait};
use crate::utils::jwt;
use crate::entities::{roles, rol_permisos, permisos, usuario_roles};

pub async fn auth_middleware(
    State(_db): State<DatabaseConnection>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    match auth_header {
        Some(auth_str) if auth_str.starts_with("Bearer ") => {
            let token = &auth_str[7..];
            match jwt::decode_jwt(token) {
                Ok(claims) => {
                    req.extensions_mut().insert(claims);
                    Ok(next.run(req).await)
                }
                Err(_) => Err(StatusCode::UNAUTHORIZED),
            }
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

pub async fn check_permission(
    db: &DatabaseConnection,
    user_id: i32,
    permission_code: &str,
) -> bool {
    // Exact join path: permisos -> rol_permisos -> roles -> usuario_roles
    let user_has_perm: u64 = permisos::Entity::find()
        .join(JoinType::InnerJoin, permisos::Relation::RolPermisos.def())
        .join(JoinType::InnerJoin, rol_permisos::Relation::Roles.def())
        .join(JoinType::InnerJoin, roles::Relation::UsuarioRoles.def())
        .filter(permisos::Column::CodigoPermiso.eq(permission_code))
        .filter(usuario_roles::Column::UsuarioId.eq(user_id))
        .count(db)
        .await
        .unwrap_or(0);

    user_has_perm > 0
}

pub async fn require_permission(
    State(db): State<DatabaseConnection>,
    request: Request<Body>,
    next: Next,
    permission_code: &'static str,
) -> Result<Response, StatusCode> {
    let claims = request.extensions().get::<jwt::Claims>()
        .ok_or(StatusCode::UNAUTHORIZED)?;
    
    tracing::info!("Verificando permiso '{}' para usuario {} en ruta {}", permission_code, claims.user_id, request.uri());
    
    if check_permission(&db, claims.user_id, permission_code).await {
        Ok(next.run(request).await)
    } else {
        tracing::warn!("Permiso denegado: '{}' para usuario {}", permission_code, claims.user_id);
        Err(StatusCode::FORBIDDEN)
    }
}

pub async fn require_any_permission<const N: usize>(
    State(db): State<DatabaseConnection>,
    request: Request<Body>,
    next: Next,
    permission_codes: [&'static str; N],
) -> Result<Response, StatusCode> {
    let claims = request.extensions().get::<jwt::Claims>()
        .ok_or(StatusCode::UNAUTHORIZED)?;
    
    for code in permission_codes {
        if check_permission(&db, claims.user_id, code).await {
            tracing::info!("Permiso CONCEDIDO: '{}' para usuario {} en ruta {}", code, claims.user_id, request.uri());
            return Ok(next.run(request).await);
        }
    }

    tracing::warn!("Permiso DENEGADO: ninguno de {:?} para usuario {} en ruta {}", permission_codes, claims.user_id, request.uri());
    Err(StatusCode::FORBIDDEN)
}
