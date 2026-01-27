use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "orden_compra_repuesto")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id_orden_compra: i32,
    pub id_ot: Option<i32>,
    pub id_proveedor: Option<i32>,
    pub fecha_solicitud: Option<Date>,
    pub estado: Option<String>,
    pub total_estimado: Option<Decimal>,
    pub codigo_compra: Option<String>,
    pub created_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::orden_trabajo::Entity",
        from = "Column::IdOt",
        to = "super::orden_trabajo::Column::IdOt",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    OrdenTrabajo,
    #[sea_orm(
        belongs_to = "super::proveedores::Entity",
        from = "Column::IdProveedor",
        to = "super::proveedores::Column::IdProveedor",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Proveedor,
    #[sea_orm(has_many = "super::orden_compra_detalle::Entity")]
    Detalles,
}

impl Related<super::orden_trabajo::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::OrdenTrabajo.def()
    }
}

impl Related<super::proveedores::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Proveedor.def()
    }
}

impl Related<super::orden_compra_detalle::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Detalles.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
