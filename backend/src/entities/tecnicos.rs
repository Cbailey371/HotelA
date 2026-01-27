use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "tecnicos")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id_tecnico: i32,
    pub nombre: String,
    pub apellido: String,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub especialidad: Option<String>,
    pub proveedor_id: Option<i32>,
    pub es_independiente: bool,
    pub costo_hora: Option<Decimal>,
    pub estado: String,
    pub codigo_tecnico: Option<String>,
    pub created_at: Option<DateTimeWithTimeZone>,
    pub updated_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::proveedores::Entity",
        from = "Column::ProveedorId",
        to = "super::proveedores::Column::IdProveedor",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Proveedores,
    #[sea_orm(has_many = "super::mantenimiento_historial::Entity")]
    MantenimientoHistorial,
}

impl Related<super::proveedores::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Proveedores.def()
    }
}

impl Related<super::mantenimiento_historial::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MantenimientoHistorial.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
