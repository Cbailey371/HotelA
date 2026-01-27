import PageTitle from "@/components/PageTitle";
import SchedulePage from "@/components/schedule/SchedulePage";
import { getMaintenances } from "@/lib/actions";
import { IParams } from "@/lib/definitions";
import React from "react";

const Page = async (props: { searchParams?: Promise<IParams> }) => {
  const searchParams = await props.searchParams;
  const maintenance = await getMaintenances({
    ...searchParams,
    perPage: 1000,
  });
  return (
    <>
      <PageTitle title="Agenda" />
      <section>
        <SchedulePage maintenances={maintenance.data || []} />
      </section>
    </>
  );
};

export default Page;
