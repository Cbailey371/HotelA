use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Insert default maintenance types
        let insert = Query::insert()
            .into_table(MantenimientoTipo::Table)
            .columns([
                MantenimientoTipo::IdTipoMantenimiento,
                MantenimientoTipo::NombreTipo,
                MantenimientoTipo::Descripcion,
                MantenimientoTipo::EsPreventivo,
                MantenimientoTipo::EsCorrectivo,
                MantenimientoTipo::RequiereParo,
            ])
            .values_panic([
                1.into(),
                "General".into(),
                "Mantenimiento General".into(),
                false.into(),
                false.into(),
                false.into(),
            ])
            .values_panic([
                2.into(),
                "Preventivo".into(),
                "Mantenimiento Preventivo".into(),
                true.into(),
                false.into(),
                false.into(),
            ])
            .values_panic([
                3.into(),
                "Correctivo".into(),
                "Mantenimiento Correctivo".into(),
                false.into(),
                true.into(),
                true.into(),
            ])
            .to_owned();

        manager.exec_stmt(insert).await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Delete the inserted types
        let delete = Query::delete()
            .from_table(MantenimientoTipo::Table)
            .and_where(Expr::col(MantenimientoTipo::IdTipoMantenimiento).is_in([1, 2, 3]))
            .to_owned();

        manager.exec_stmt(delete).await?;

        Ok(())
    }
}

#[derive(Iden)]
enum MantenimientoTipo {
    Table,
    IdTipoMantenimiento,
    NombreTipo,
    Descripcion,
    EsPreventivo,
    EsCorrectivo,
    RequiereParo,
}
