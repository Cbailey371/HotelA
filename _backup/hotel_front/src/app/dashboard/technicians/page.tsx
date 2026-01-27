import ReplacementsPage from "@/components/replacements/ReplacementsPage";
import React from "react";
import { getReplacements, getTechnicians } from "@/lib/actions";
import { IParams } from "@/lib/definitions";
import PageTitle from "@/components/PageTitle";
import TechniciansPage from "@/components/technicians/TechniciansPage";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const technicians = await getTechnicians(searchParams || {});

  const columns = [
    { name: "Nombre", uid: "name", sortable: true },
    { name: "Email", uid: "email", sortable: true },
    { name: "Teléfono", uid: "phone", sortable: true },
    { name: "Proveedor", uid: "provider.name", sortable: true },
    { name: "Acciones", uid: "actions" },
  ];

  return (
    <>
      <PageTitle title="Técnicos" />
      <section>
        <TechniciansPage
          data={technicians?.data || []}
          columns={columns}
          meta={
            technicians?.meta || {
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
