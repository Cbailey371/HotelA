import React from "react";
import { getUsers } from "@/lib/actions";
import { IParams } from "@/lib/definitions";
import UsersPage from "@/components/users/UsersPage";
import PageTitle from "@/components/PageTitle";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const users = await getUsers(searchParams || {});
  const columns = [
    { name: "Nombre", uid: "name", sortable: true },
    { name: "email", uid: "email", sortable: true },
    // { name: "Rol", uid: "role" },
    { name: "Acciones", uid: "actions" },
  ];
  return (
    <>
      <PageTitle title="Usuarios" />
      <section>
        <UsersPage
          data={users?.data || []}
          columns={columns}
          meta={
            users?.meta || {
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
