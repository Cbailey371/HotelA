use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let components = [
            "Puerta Hab.",
            "Módulo TV",
            "Módulo Closet",
            "Lámpara cielo raso",
            "Ventana Hab.",
            "Cama #1 DBL",
            "Cama #2 DBL",
            "Cama King",
            "Mesita de noche",
            "Lámpara mesita de noche",
            "Puerta baño",
            "Lámpara baño",
            "Ventana baño",
            "Lavamanos",
            "Inodoro",
            "Grifo lavamanos",
            "Ducha regadera",
            "Grifo frío ducha",
            "Grifo caliente ducha",
            "Grifo selector tina jacuzzi/regadera",
            "Tina jacuzzi",
            "Cortina ducha",
            "Papelera inodoro",
            "Jabonera ducha",
            "Toalla espejo",
            "Espejo baño",
            "Espejo habitación",
            "Mesita escritorio",
            "Silla escritorio",
            "Nevera",
            "Cerradura pta. hab (bat)",
            "Cerradura pta. baño",
            "Asiento inodoro",
            "Colchón DBL #1",
            "Colchón DBL #2",
            "Colchón King",
            "Cama 3/4",
            "Colchón 3/4",
            "TV",
            "Teléfono",
            "Salida teléfono",
            "Caja seguridad (bat)",
        ];

        let mut insert = sea_query::Query::insert();
        insert.into_table(ComponentesEstandar::Table)
              .columns([ComponentesEstandar::Nombre, ComponentesEstandar::Categoria]);

        for name in components {
            insert.values_panic(vec![name.into(), "Habitaciones".into()]);
        }

        manager.exec_stmt(insert.to_owned()).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // En el down removemos los que insertamos, aunque usualmente 
        // las semillas no se deshacen detalle a detalle a menos que sea crítico.
        // Por simplicidad en este caso, eliminamos donde la categoría sea "Habitaciones"
        let delete = sea_query::Query::delete()
            .from_table(ComponentesEstandar::Table)
            .and_where(Expr::col(ComponentesEstandar::Categoria).eq("Habitaciones"))
            .to_owned();

        manager.exec_stmt(delete).await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum ComponentesEstandar {
    Table,
    Nombre,
    Categoria,
}
