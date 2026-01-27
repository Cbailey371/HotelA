use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "orden_trabajo")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id_ot: i32,
    pub id_calendario: Option<i32>,
    pub id_activo: i32,
    pub id_tipo_mantenimiento: Option<i32>,
    pub id_tecnico: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub fecha_inicio_real: Option<DateTimeWithTimeZone>,
    pub fecha_fin_real: Option<DateTimeWithTimeZone>,
    pub estado: Option<String>,
    pub prioridad: Option<String>,
    pub observaciones: Option<String>,
    pub codigo_ot: Option<String>,
    pub created_at: Option<DateTimeWithTimeZone>,
    pub updated_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::activos_equipos::Entity",
        from = "Column::IdActivo",
        to = "super::activos_equipos::Column::IdEquipo",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Activo,
    #[sea_orm(
        belongs_to = "super::tecnicos::Entity",
        from = "Column::IdTecnico",
        to = "super::tecnicos::Column::IdTecnico",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Tecnico,
    #[sea_orm(
        belongs_to = "super::proveedores::Entity",
        from = "Column::IdProveedor",
        to = "super::proveedores::Column::IdProveedor",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Proveedor,
}

impl Related<super::activos_equipos::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Activo.def()
    }
}

impl Related<super::tecnicos::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tecnico.def()
    }
}

impl Related<super::proveedores::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Proveedor.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
