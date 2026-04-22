use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "activo_componentes")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id_activo: i32,
    #[sea_orm(primary_key, auto_increment = false)]
    pub id_componente: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::activos_equipos::Entity",
        from = "Column::IdActivo",
        to = "super::activos_equipos::Column::IdEquipo",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    ActivosEquipos,
    #[sea_orm(
        belongs_to = "super::componentes_estandar::Entity",
        from = "Column::IdComponente",
        to = "super::componentes_estandar::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    ComponentesEstandar,
}

impl Related<super::activos_equipos::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ActivosEquipos.def()
    }
}

impl Related<super::componentes_estandar::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ComponentesEstandar.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
