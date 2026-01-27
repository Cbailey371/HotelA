import MaintenancesPage from "@/components/maintenaces/MaintenancesPage";
import PageTitle from "@/components/PageTitle";
import { getMaintenances } from "@/lib/actions";
import { IParams } from "@/lib/definitions";
import React from "react";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const maintenance = await getMaintenances(searchParams || {});
  const columns = [
    { name: "Equipo", uid: "asset.name", sortable: true },
    { name: "Tipo", uid: "maintenanceType", sortable: true },
    { name: "Descripción", uid: "description", sortable: true },
    { name: "Dias de aviso", uid: "alertDaysBefore", sortable: true },
    { name: "Fecha programada", uid: "scheduledDate", sortable: true },
    { name: "Frecuencia", uid: "frequency", sortable: true },
    { name: "Prioridad", uid: "priority", sortable: true },
    { name: "Estado", uid: "status", sortable: true },
    { name: "Responsable", uid: "responsible", sortable: true },
    { name: "Código", uid: "maintenanceCode", sortable: true },
    { name: "Costo estimado", uid: "estimatedCost", sortable: true },
    { name: "Proveedor", uid: "provider.name", sortable: true },
    { name: "Técnico", uid: "technician.name", sortable: true },
    { name: "Acciones", uid: "actions" },
  ];

  // console.log(maintenance)
  return (
    <>
      <PageTitle title="Mantenimientos" />
      <section>
        <MaintenancesPage
          data={maintenance?.data || []}
          columns={columns}
          meta={
            maintenance?.meta || {
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
