import ReplacementsPage from "@/components/replacements/ReplacementsPage";
import React from "react";
import { getReplacements } from "@/lib/actions";
import { IParams } from "@/lib/definitions";
import PageTitle from "@/components/PageTitle";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const replacements = await getReplacements(searchParams || {});

  const columns = [
    { name: "Nombre", uid: "name", sortable: true },
    { name: "Equipo", uid: "asset.name", sortable: true },
    { name: "Tipo", uid: "sparePartType", sortable: true },
    { name: "Modelo", uid: "model", sortable: true },
    { name: "Marca", uid: "brand", sortable: true },
    { name: "Año", uid: "year", sortable: true },
    { name: "Cantidad disponible", uid: "availableQuantity", sortable: true },
    { name: "Cantidad mínima", uid: "minimumStock", sortable: true },
    { name: "Vida útil estimada", uid: "estimatedUsefulLife", sortable: true },
    { name: "Fecha de última compra", uid: "lastPurchaseDate", sortable: true },
    { name: "Fecha de instalación", uid: "installationDate", sortable: true },
    { name: "Fecha de vencimiento", uid: "expirationDate", sortable: true },
    { name: "Ubicación", uid: "storageLocation", sortable: true },
    { name: "Ubicación exacta", uid: "exactPhysicalLocation", sortable: true },
    { name: "Proveedor", uid: "provider.name", sortable: true },
    { name: "Costo unitario", uid: "unitCost", sortable: true },
    { name: "Modelos compatibles", uid: "compatibilityModels", sortable: true },
    { name: "Acciones", uid: "actions" },
  ];

  return (
    <>
      <PageTitle title="Repuestos" />
      <section>
        <ReplacementsPage
          data={replacements?.data || []}
          columns={columns}
          meta={
            replacements?.meta || {
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
