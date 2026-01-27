use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Empresas
        manager
            .create_table(
                Table::create()
                    .table(Empresas::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Empresas::IdEmpresa).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(Empresas::NombreEmpresa).string().not_null())
                    .col(ColumnDef::new(Empresas::Ruc).string())
                    .col(ColumnDef::new(Empresas::Direccion).string())
                    .col(ColumnDef::new(Empresas::Telefono).string())
                    .col(ColumnDef::new(Empresas::Email).string())
                    .col(ColumnDef::new(Empresas::Estado).string().default("activo"))
                    .col(ColumnDef::new(Empresas::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Empresas::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;

        // 2. Roles
        manager
            .create_table(
                Table::create()
                    .table(Roles::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Roles::IdRol).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(Roles::NombreRol).string().not_null())
                    .col(ColumnDef::new(Roles::Descripcion).string())
                    .col(ColumnDef::new(Roles::Nivel).integer().default(3))
                    .col(ColumnDef::new(Roles::Estado).string().default("activo"))
                    .col(ColumnDef::new(Roles::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Roles::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;

        // 3. Permisos
        manager
            .create_table(
                Table::create()
                    .table(Permisos::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Permisos::IdPermiso).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(Permisos::CodigoPermiso).string().not_null())
                    .col(ColumnDef::new(Permisos::Descripcion).string())
                    .col(ColumnDef::new(Permisos::Modulo).string())
                    .col(ColumnDef::new(Permisos::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Permisos::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;

        // 4. Rol_Permisos
        manager
            .create_table(
                Table::create()
                    .table(RolPermisos::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(RolPermisos::IdRolPermiso).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(RolPermisos::RolId).integer().not_null())
                    .col(ColumnDef::new(RolPermisos::PermisoId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_rol_permisos_rol")
                            .from(RolPermisos::Table, RolPermisos::RolId)
                            .to(Roles::Table, Roles::IdRol),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_rol_permisos_permiso")
                            .from(RolPermisos::Table, RolPermisos::PermisoId)
                            .to(Permisos::Table, Permisos::IdPermiso),
                    )
                    .to_owned(),
            )
            .await?;

        // 5. Usuarios
        manager
            .create_table(
                Table::create()
                    .table(Usuarios::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Usuarios::IdUsuario).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(Usuarios::Nombre).string().not_null())
                    .col(ColumnDef::new(Usuarios::Apellido).string().not_null())
                    .col(ColumnDef::new(Usuarios::Email).string().not_null())
                    .col(ColumnDef::new(Usuarios::Usuario).string().not_null())
                    .col(ColumnDef::new(Usuarios::PasswordHash).string().not_null())
                    .col(ColumnDef::new(Usuarios::Telefono).string())
                    .col(ColumnDef::new(Usuarios::Cargo).string())
                    .col(ColumnDef::new(Usuarios::EmpresaId).integer())
                    .col(ColumnDef::new(Usuarios::Estado).string().default("activo"))
                    .col(ColumnDef::new(Usuarios::UltimoLogin).timestamp_with_time_zone())
                    .col(ColumnDef::new(Usuarios::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Usuarios::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_usuarios_empresa")
                            .from(Usuarios::Table, Usuarios::EmpresaId)
                            .to(Empresas::Table, Empresas::IdEmpresa),
                    )
                    .to_owned(),
            )
            .await?;

        // 6. Usuario_Roles
        manager
            .create_table(
                Table::create()
                    .table(UsuarioRoles::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(UsuarioRoles::IdUsuarioRol).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(UsuarioRoles::UsuarioId).integer().not_null())
                    .col(ColumnDef::new(UsuarioRoles::RolId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_usuario_roles_usuario")
                            .from(UsuarioRoles::Table, UsuarioRoles::UsuarioId)
                            .to(Usuarios::Table, Usuarios::IdUsuario),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_usuario_roles_rol")
                            .from(UsuarioRoles::Table, UsuarioRoles::RolId)
                            .to(Roles::Table, Roles::IdRol),
                    )
                    .to_owned(),
            )
            .await?;

        // 7. Proveedores
        manager
            .create_table(
                Table::create()
                    .table(Proveedores::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Proveedores::IdProveedor).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(Proveedores::NombreProveedor).string().not_null())
                    .col(ColumnDef::new(Proveedores::TipoProveedor).string())
                    .col(ColumnDef::new(Proveedores::ContactoNombre).string())
                    .col(ColumnDef::new(Proveedores::Telefono).string())
                    .col(ColumnDef::new(Proveedores::Email).string())
                    .col(ColumnDef::new(Proveedores::Direccion).string())
                    .col(ColumnDef::new(Proveedores::Pais).string())
                    .col(ColumnDef::new(Proveedores::Estado).string().default("activo"))
                    .col(ColumnDef::new(Proveedores::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Proveedores::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;

        // 8. Activos_Equipos
        manager
            .create_table(
                Table::create()
                    .table(ActivosEquipos::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(ActivosEquipos::IdEquipo).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(ActivosEquipos::CodigoEquipo).string().not_null())
                    .col(ColumnDef::new(ActivosEquipos::NombreEquipo).string().not_null())
                    .col(ColumnDef::new(ActivosEquipos::Descripcion).string())
                    .col(ColumnDef::new(ActivosEquipos::Categoria).string())
                    .col(ColumnDef::new(ActivosEquipos::Marca).string())
                    .col(ColumnDef::new(ActivosEquipos::Modelo).string())
                    .col(ColumnDef::new(ActivosEquipos::NumeroSerie).string())
                    .col(ColumnDef::new(ActivosEquipos::Ubicacion).string())
                    .col(ColumnDef::new(ActivosEquipos::AreaResponsable).string())
                    .col(ColumnDef::new(ActivosEquipos::Estado).string().default("activo"))
                    .col(ColumnDef::new(ActivosEquipos::FechaAdquisicion).date())
                    .col(ColumnDef::new(ActivosEquipos::VidaUtilMeses).integer())
                    .col(ColumnDef::new(ActivosEquipos::FechaFinVidaUtil).date())
                    .col(ColumnDef::new(ActivosEquipos::ValorCompra).decimal())
                    .col(ColumnDef::new(ActivosEquipos::ProveedorId).integer())
                    .col(ColumnDef::new(ActivosEquipos::ResponsableId).integer())
                    .col(ColumnDef::new(ActivosEquipos::Observaciones).string())
                    .col(ColumnDef::new(ActivosEquipos::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(ActivosEquipos::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_activos_equipos_proveedor")
                            .from(ActivosEquipos::Table, ActivosEquipos::ProveedorId)
                            .to(Proveedores::Table, Proveedores::IdProveedor),
                    )
                     .foreign_key(
                        ForeignKey::create()
                            .name("fk_activos_equipos_responsable")
                            .from(ActivosEquipos::Table, ActivosEquipos::ResponsableId)
                            .to(Usuarios::Table, Usuarios::IdUsuario),
                    )
                    .to_owned(),
            )
            .await?;

        // 9. Activos_Repuestos
        manager
            .create_table(
                Table::create()
                    .table(ActivosRepuestos::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(ActivosRepuestos::IdRepuesto).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(ActivosRepuestos::CodigoRepuesto).string().not_null())
                    .col(ColumnDef::new(ActivosRepuestos::NombreRepuesto).string().not_null())
                    .col(ColumnDef::new(ActivosRepuestos::Descripcion).string())
                    .col(ColumnDef::new(ActivosRepuestos::Marca).string())
                    .col(ColumnDef::new(ActivosRepuestos::Modelo).string())
                    .col(ColumnDef::new(ActivosRepuestos::TipoRepuesto).string())
                    .col(ColumnDef::new(ActivosRepuestos::StockActual).integer())
                    .col(ColumnDef::new(ActivosRepuestos::StockMinimo).integer())
                    .col(ColumnDef::new(ActivosRepuestos::UnidadMedida).string())
                    .col(ColumnDef::new(ActivosRepuestos::CostoUnitario).decimal())
                    .col(ColumnDef::new(ActivosRepuestos::UbicacionAlmacen).string())
                    .col(ColumnDef::new(ActivosRepuestos::ProveedorId).integer())
                    .col(ColumnDef::new(ActivosRepuestos::Estado).string().default("activo"))
                    .col(ColumnDef::new(ActivosRepuestos::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(ActivosRepuestos::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_activos_repuestos_proveedor")
                            .from(ActivosRepuestos::Table, ActivosRepuestos::ProveedorId)
                            .to(Proveedores::Table, Proveedores::IdProveedor),
                    )
                    .to_owned(),
            )
            .await?;

        // 10. Mantenimiento_Tipo
        manager
            .create_table(
                Table::create()
                    .table(MantenimientoTipo::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(MantenimientoTipo::IdTipoMantenimiento).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(MantenimientoTipo::NombreTipo).string().not_null())
                    .col(ColumnDef::new(MantenimientoTipo::Descripcion).string())
                    .col(ColumnDef::new(MantenimientoTipo::EsPreventivo).boolean().default(false))
                    .col(ColumnDef::new(MantenimientoTipo::EsCorrectivo).boolean().default(false))
                    .col(ColumnDef::new(MantenimientoTipo::RequiereParo).boolean().default(false))
                    .col(ColumnDef::new(MantenimientoTipo::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(MantenimientoTipo::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;

        // 11. Mantenimiento_Calendario
        manager
            .create_table(
                Table::create()
                    .table(MantenimientoCalendario::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(MantenimientoCalendario::IdMantenimientoCalendario).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(MantenimientoCalendario::EquipoId).integer().not_null())
                    .col(ColumnDef::new(MantenimientoCalendario::TipoMantenimientoId).integer().not_null())
                    .col(ColumnDef::new(MantenimientoCalendario::Frecuencia).string())
                    .col(ColumnDef::new(MantenimientoCalendario::IntervaloValor).integer())
                    .col(ColumnDef::new(MantenimientoCalendario::FechaProgramada).date())
                    .col(ColumnDef::new(MantenimientoCalendario::FechaUltimaEjecucion).date())
                    .col(ColumnDef::new(MantenimientoCalendario::ProximaFecha).date())
                    .col(ColumnDef::new(MantenimientoCalendario::ResponsableId).integer())
                    .col(ColumnDef::new(MantenimientoCalendario::Estado).string().default("pendiente"))
                    .col(ColumnDef::new(MantenimientoCalendario::Observaciones).string())
                    .col(ColumnDef::new(MantenimientoCalendario::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(MantenimientoCalendario::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_mantenimiento_calendario_equipo")
                            .from(MantenimientoCalendario::Table, MantenimientoCalendario::EquipoId)
                            .to(ActivosEquipos::Table, ActivosEquipos::IdEquipo),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_mantenimiento_calendario_tipo")
                            .from(MantenimientoCalendario::Table, MantenimientoCalendario::TipoMantenimientoId)
                            .to(MantenimientoTipo::Table, MantenimientoTipo::IdTipoMantenimiento),
                    )
                     .foreign_key(
                        ForeignKey::create()
                            .name("fk_mantenimiento_calendario_responsable")
                            .from(MantenimientoCalendario::Table, MantenimientoCalendario::ResponsableId)
                            .to(Usuarios::Table, Usuarios::IdUsuario),
                    )
                    .to_owned(),
            )
            .await?;

        // 12. Mantenimiento_Historial
        manager
            .create_table(
                Table::create()
                    .table(MantenimientoHistorial::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(MantenimientoHistorial::IdMantenimiento).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(MantenimientoHistorial::EquipoId).integer().not_null())
                    .col(ColumnDef::new(MantenimientoHistorial::TipoMantenimientoId).integer().not_null())
                    .col(ColumnDef::new(MantenimientoHistorial::FechaInicio).timestamp_with_time_zone())
                    .col(ColumnDef::new(MantenimientoHistorial::FechaFin).timestamp_with_time_zone())
                    .col(ColumnDef::new(MantenimientoHistorial::TecnicoResponsable).string())
                    .col(ColumnDef::new(MantenimientoHistorial::DescripcionTrabajo).string())
                    .col(ColumnDef::new(MantenimientoHistorial::Resultado).string())
                    .col(ColumnDef::new(MantenimientoHistorial::HorasTrabajo).decimal())
                    .col(ColumnDef::new(MantenimientoHistorial::CostoManoObra).decimal())
                    .col(ColumnDef::new(MantenimientoHistorial::CostoTotal).decimal())
                    .col(ColumnDef::new(MantenimientoHistorial::Observaciones).string())
                    .col(ColumnDef::new(MantenimientoHistorial::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(MantenimientoHistorial::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_mantenimiento_historial_equipo")
                            .from(MantenimientoHistorial::Table, MantenimientoHistorial::EquipoId)
                            .to(ActivosEquipos::Table, ActivosEquipos::IdEquipo),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_mantenimiento_historial_tipo")
                            .from(MantenimientoHistorial::Table, MantenimientoHistorial::TipoMantenimientoId)
                            .to(MantenimientoTipo::Table, MantenimientoTipo::IdTipoMantenimiento),
                    )
                    .to_owned(),
            )
            .await?;

        // 13. Historial_Repuestos
        manager
            .create_table(
                Table::create()
                    .table(HistorialRepuestos::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(HistorialRepuestos::IdHistorialRepuesto).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(HistorialRepuestos::RepuestoId).integer().not_null())
                    .col(ColumnDef::new(HistorialRepuestos::EquipoId).integer())
                    .col(ColumnDef::new(HistorialRepuestos::MantenimientoId).integer())
                    .col(ColumnDef::new(HistorialRepuestos::CantidadUtilizada).integer())
                    .col(ColumnDef::new(HistorialRepuestos::FechaUso).date())
                    .col(ColumnDef::new(HistorialRepuestos::TecnicoResponsable).string())
                    .col(ColumnDef::new(HistorialRepuestos::Motivo).string())
                    .col(ColumnDef::new(HistorialRepuestos::CreatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(HistorialRepuestos::UpdatedAt).timestamp_with_time_zone().default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_historial_repuestos_repuesto")
                            .from(HistorialRepuestos::Table, HistorialRepuestos::RepuestoId)
                            .to(ActivosRepuestos::Table, ActivosRepuestos::IdRepuesto),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_historial_repuestos_equipo")
                            .from(HistorialRepuestos::Table, HistorialRepuestos::EquipoId)
                            .to(ActivosEquipos::Table, ActivosEquipos::IdEquipo),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_historial_repuestos_mantenimiento")
                            .from(HistorialRepuestos::Table, HistorialRepuestos::MantenimientoId)
                            .to(MantenimientoHistorial::Table, MantenimientoHistorial::IdMantenimiento),
                    )
                    .to_owned(),
            )
            .await?;

        // 14. Auditoria_Acciones
        manager
            .create_table(
                Table::create()
                    .table(AuditoriaAcciones::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(AuditoriaAcciones::IdAuditoria).integer().not_null().auto_increment().primary_key())
                    .col(ColumnDef::new(AuditoriaAcciones::UsuarioId).integer())
                    .col(ColumnDef::new(AuditoriaAcciones::Accion).string())
                    .col(ColumnDef::new(AuditoriaAcciones::TablaAfectada).string())
                    .col(ColumnDef::new(AuditoriaAcciones::RegistroId).integer())
                    .col(ColumnDef::new(AuditoriaAcciones::Fecha).timestamp_with_time_zone())
                    .col(ColumnDef::new(AuditoriaAcciones::IpOrigen).string())
                    .col(ColumnDef::new(AuditoriaAcciones::Detalle).string())
                     .foreign_key(
                        ForeignKey::create()
                            .name("fk_auditoria_acciones_usuario")
                            .from(AuditoriaAcciones::Table, AuditoriaAcciones::UsuarioId)
                            .to(Usuarios::Table, Usuarios::IdUsuario),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.drop_table(Table::drop().table(AuditoriaAcciones::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(HistorialRepuestos::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(MantenimientoHistorial::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(MantenimientoCalendario::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(MantenimientoTipo::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(ActivosRepuestos::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(ActivosEquipos::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(Proveedores::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(UsuarioRoles::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(Usuarios::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(RolPermisos::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(Permisos::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(Roles::Table).to_owned()).await?;
        manager.drop_table(Table::drop().table(Empresas::Table).to_owned()).await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Empresas {
    Table,
    IdEmpresa,
    NombreEmpresa,
    Ruc,
    Direccion,
    Telefono,
    Email,
    Estado,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
pub enum Roles {
    Table,
    IdRol,
    NombreRol,
    Descripcion,
    Nivel,
    Estado,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
pub enum Permisos {
    Table,
    IdPermiso,
    CodigoPermiso,
    Descripcion,
    Modulo,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
pub enum RolPermisos {
    Table,
    IdRolPermiso,
    RolId,
    PermisoId,
}

#[derive(DeriveIden)]
pub enum Usuarios {
    Table,
    IdUsuario,
    Nombre,
    Apellido,
    Email,
    Usuario,
    PasswordHash,
    Telefono,
    Cargo,
    EmpresaId,
    Estado,
    UltimoLogin,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
pub enum UsuarioRoles {
    Table,
    IdUsuarioRol,
    UsuarioId,
    RolId,
}

#[derive(DeriveIden)]
enum Proveedores {
    Table,
    IdProveedor,
    NombreProveedor,
    TipoProveedor,
    ContactoNombre,
    Telefono,
    Email,
    Direccion,
    Pais,
    Estado,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ActivosEquipos {
    Table,
    IdEquipo,
    CodigoEquipo,
    NombreEquipo,
    Descripcion,
    Categoria,
    Marca,
    Modelo,
    NumeroSerie,
    Ubicacion,
    AreaResponsable,
    Estado,
    FechaAdquisicion,
    VidaUtilMeses,
    FechaFinVidaUtil,
    ValorCompra,
    ProveedorId,
    ResponsableId,
    Observaciones,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ActivosRepuestos {
    Table,
    IdRepuesto,
    CodigoRepuesto,
    NombreRepuesto,
    Descripcion,
    Marca,
    Modelo,
    TipoRepuesto,
    StockActual,
    StockMinimo,
    UnidadMedida,
    CostoUnitario,
    UbicacionAlmacen,
    ProveedorId,
    Estado,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum MantenimientoTipo {
    Table,
    IdTipoMantenimiento,
    NombreTipo,
    Descripcion,
    EsPreventivo,
    EsCorrectivo,
    RequiereParo,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum MantenimientoCalendario {
    Table,
    IdMantenimientoCalendario,
    EquipoId,
    TipoMantenimientoId,
    Frecuencia,
    IntervaloValor,
    FechaProgramada,
    FechaUltimaEjecucion,
    ProximaFecha,
    ResponsableId,
    Estado,
    Observaciones,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum MantenimientoHistorial {
    Table,
    IdMantenimiento,
    EquipoId,
    TipoMantenimientoId,
    FechaInicio,
    FechaFin,
    TecnicoResponsable,
    DescripcionTrabajo,
    Resultado,
    HorasTrabajo,
    CostoManoObra,
    CostoTotal,
    Observaciones,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum HistorialRepuestos {
    Table,
    IdHistorialRepuesto,
    RepuestoId,
    EquipoId,
    MantenimientoId,
    CantidadUtilizada,
    FechaUso,
    TecnicoResponsable,
    Motivo,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum AuditoriaAcciones {
    Table,
    IdAuditoria,
    UsuarioId,
    Accion,
    TablaAfectada,
    RegistroId,
    Fecha,
    IpOrigen,
    Detalle,
}
