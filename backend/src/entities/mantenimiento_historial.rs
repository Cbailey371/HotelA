use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "mantenimiento_historial")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id_mantenimiento: i32,
    pub calendario_id: Option<i32>,
    pub equipo_id: Option<i32>,
    pub fecha_ejecucion: Option<Date>,
    pub horas_trabajo: Option<Decimal>,
    pub costo_mano_obra: Option<Decimal>,
    pub costo_total: Option<Decimal>,
    pub observaciones: Option<String>,
    pub tecnico_id: Option<i32>,
    pub created_at: Option<DateTimeWithTimeZone>,
    pub updated_at: Option<DateTimeWithTimeZone>,
    pub tipo_mantenimiento_id: Option<i32>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::activos_equipos::Entity",
        from = "Column::EquipoId",
        to = "super::activos_equipos::Column::IdEquipo",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    ActivosEquipos,
    #[sea_orm(
        belongs_to = "super::mantenimiento_calendario::Entity",
        from = "Column::CalendarioId",
        to = "super::mantenimiento_calendario::Column::IdMantenimientoCalendario",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    MantenimientoCalendario,
    #[sea_orm(
        belongs_to = "super::tecnicos::Entity",
        from = "Column::TecnicoId",
        to = "super::tecnicos::Column::IdTecnico",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Tecnicos,
    #[sea_orm(has_many = "super::historial_repuestos::Entity")]
    HistorialRepuestos,
    #[sea_orm(
        belongs_to = "super::mantenimiento_tipo::Entity",
        from = "Column::TipoMantenimientoId",
        to = "super::mantenimiento_tipo::Column::IdTipoMantenimiento",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    MantenimientoTipo,
}

impl Related<super::activos_equipos::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ActivosEquipos.def()
    }
}

impl Related<super::mantenimiento_calendario::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MantenimientoCalendario.def()
    }
}

impl Related<super::tecnicos::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tecnicos.def()
    }
}

impl Related<super::historial_repuestos::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::HistorialRepuestos.def()
    }
}

impl Related<super::mantenimiento_tipo::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MantenimientoTipo.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
