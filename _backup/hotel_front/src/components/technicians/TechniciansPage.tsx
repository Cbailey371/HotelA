"use client";
import { useUrlSort } from "@/hooks/useUrlSort";
import { IColumn, IPagination, ITechnician } from "@/lib/definitions";
import React, { useCallback } from "react";
import CustomTable from "../CustomTable";
import CustomPagination from "../CustomPagination";
import SearchBar from "../SearchBar";
import { Button } from "@heroui/button";
import { downloadBlob } from "@/lib/utils";
import {
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { downloadTechnicians } from "@/lib/data";
import AddTechnician from "./AddTechnician";
import EditTechnician from "./EditTechnician";
import DeleteTechnician from "./DeleteTechnician";

const TechniciansPage = ({
  columns,
  data,
  meta,
}: {
  columns: IColumn[];
  data: ITechnician[];
  meta: IPagination;
}) => {
  const { sortDescriptor, setSortDescriptor } = useUrlSort("name");

  const renderCell = useCallback((data: ITechnician, columnKey: React.Key) => {
    const cellValue = data[columnKey as keyof ITechnician] || "No aplica";

    switch (columnKey) {
      case "provider.name":
        // @ts-ignore
        return <div>{data?.provider?.name || "No aplica"}</div>;
      case "actions":
        return (
          <div className="relative flex justify-end items-center">
            <EditTechnician technician={data} />
            <DeleteTechnician technician={data} />
          </div>
        );
      default:
        return cellValue as string;
    }
  }, []);

  return (
    <CustomTable
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      bottomContent={<CustomPagination totalPages={meta.lastPage} />}
      topContent={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between gap-3 items-end">
            <SearchBar
              whereParamCallback={(term: string) => [
                {
                  key: "name",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "email",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "phone",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "provider.name",
                  value: term,
                  operator: "contains",
                },
              ]}
            />
            <div className="flex w-full gap-3 justify-end">
              <AddTechnician />
              <Button
                color="secondary"
                className="w-full md:w-auto"
                onPress={async () => {
                  const response = await downloadTechnicians();
                  downloadBlob(response, "tecnicos.xlsx");
                }}
              >
                <span className="icon-[material-symbols--download]" />
                Descargar datos
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            className="min-w-32"
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent="Sin datos encontrados" items={data}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </CustomTable>
  );
};

export default TechniciansPage;
