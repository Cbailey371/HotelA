"use client";
import { ILocation, IColumn, IPagination } from "@/lib/definitions";
import {
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import React, { useCallback } from "react";
import CustomPagination from "../CustomPagination";
import SearchBar from "../SearchBar";
import { AddLocation } from "./AddLocation";
import { EditLocation } from "./EditLocation";
import DeleteLocation from "./DeleteLocation";
import CustomTable from "../CustomTable";
import { Button } from "@heroui/button";
import { downloadBlob } from "@/lib/utils";
import { downloadLocations } from "@/lib/data";
import { useUrlSort } from "@/hooks/useUrlSort";

const LocationPage = ({
  columns,
  data,
  meta,
}: {
  columns: IColumn[];
  data: ILocation[];
  meta: IPagination;
}) => {
  const { sortDescriptor, setSortDescriptor } = useUrlSort("name");

  const renderCell = useCallback((data: ILocation, columnKey: React.Key) => {
    const cellValue = data[columnKey as keyof ILocation] || "No aplica";

    switch (columnKey) {
      case "actions":
        return (
          <div className="relative flex justify-end items-center">
            <EditLocation location={data} />
            <DeleteLocation location={data} />
          </div>
        );
      default:
        return cellValue;
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
                  key: "description",
                  value: term,
                  operator: "contains",
                },
              ]}
            />
            <div className="flex w-full gap-3 justify-end">
              <AddLocation />
              <Button
                color="secondary"
                className="w-full md:w-auto"
                onPress={async () => {
                  const response = await downloadLocations();
                  downloadBlob(response, "locations.xlsx");
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

export default LocationPage;
