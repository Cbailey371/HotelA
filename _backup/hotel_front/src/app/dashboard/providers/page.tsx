import ProvidersPage from "@/components/providers/ProvidersPage";
import React from "react";
import { getProviders } from "@/lib/actions";
import { IParams } from "@/lib/definitions";
import PageTitle from "@/components/PageTitle";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const providers = await getProviders(searchParams || {});
  const columns = [
    { name: "Nombre", uid: "name", sortable: true },
    { name: "RUC", uid: "taxId", sortable: true },
    { name: "Contacto principal", uid: "mainContact", sortable: true },
    { name: "Teléfono", uid: "phone", sortable: true },
    { name: "Correo", uid: "email", sortable: true },
    { name: "Dirección", uid: "address", sortable: true },
    { name: "Ciudad", uid: "city", sortable: true },
    { name: "País", uid: "country", sortable: true },
    { name: "Sitio web", uid: "website", sortable: true },
    { name: "Tipo de proveedor", uid: "providerType", sortable: true },
    { name: "Métodos de pago", uid: "paymentMethods", sortable: true },
    { name: "Notas", uid: "notes", sortable: true },
    { name: "Acciones", uid: "actions" },
  ];
  return (
    <>
      <PageTitle title="Proveedores" />
      <section>
        <ProvidersPage
          data={providers?.data || []}
          columns={columns}
          meta={
            providers?.meta || {
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
