import React from "react";
import { getLocations } from "@/lib/actions";
import LocationPage from "@/components/locations/LocationsPage";
import { IParams } from "@/lib/definitions";
import PageTitle from "@/components/PageTitle";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const locations = await getLocations(searchParams || {});
  const columns = [
    { name: "Nombre", uid: "name", sortable: true },
    { name: "Descripción", uid: "description", sortable: true },
    { name: "Acciones", uid: "actions" },
  ];
  return (
    <>
      <PageTitle title="Ubicaciones" />
      <section>
        <LocationPage
          data={locations?.data || []}
          columns={columns}
          meta={
            locations?.meta || {
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
