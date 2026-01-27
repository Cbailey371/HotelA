import AssetsPage from "@/components/assets/AssetsPage";
import PageTitle from "@/components/PageTitle";
import { getAssets } from "@/lib/actions";
import { IParams } from "@/lib/definitions";
import React from "react";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const assets = await getAssets(searchParams || {});
  const columns = [
    { name: "Foto", uid: "photoUrl" },
    { name: "Nombre", uid: "name", sortable: true },
    { name: "Código", uid: "code", sortable: true },
    { name: "Categoría", uid: "category", sortable: true },
    { name: "Tipo de equipo", uid: "assetType", sortable: true },
    { name: "Detalles de ubicación", uid: "locationDetail", sortable: true },
    { name: "Ubicación", uid: "location.name", sortable: true },
    { name: "Marca", uid: "brand", sortable: true },
    { name: "Modelo", uid: "model", sortable: true },
    { name: "Número serial", uid: "serialNumber", sortable: true },
    { name: "Año", uid: "year", sortable: true },
    { name: "Color", uid: "color", sortable: true },
    { name: "Número de motor", uid: "engineNumber", sortable: true },
    { name: "Número de chasis", uid: "chassisNumber", sortable: true },
    // { name: "Manual", uid: "manualUrl" },
    { name: "Responsable", uid: "responsible", sortable: true },
    { name: "Fecha de compra", uid: "acquisitionDate", sortable: true },
    { name: "Fecha de instalación", uid: "installationDate", sortable: true },
    { name: "Fecha desmantelamiento", uid: "decommissionDate", sortable: true },
    { name: "Proveedor", uid: "provider.name", sortable: true },
    { name: "Costo", uid: "value", sortable: true },
    { name: "Vida útil", uid: "usefulLife", sortable: true },
    { name: "Estado", uid: "status", sortable: true },
    { name: "Notas", uid: "notes", sortable: true },
    { name: "Acciones", uid: "actions" },
  ];
  return (
    <>
      <PageTitle title="Activos" />
      <section>
        <AssetsPage
          data={assets?.data || []}
          columns={columns}
          meta={
            assets?.meta || {
              total: 0,
              lastPage: 1,
              currentPage: 1,
              perPage: 10,
              prev: null,
              next: null,
            }
          }
        />
      </section>
    </>
  );
};

export default Page;
