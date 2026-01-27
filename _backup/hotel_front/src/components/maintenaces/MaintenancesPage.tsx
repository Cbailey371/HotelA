"use client";
import { IColumn, IMaintenance, IPagination } from "@/lib/definitions";
import { amountFormatter, downloadBlob, formatDateUTC } from "@/lib/utils";
import React, { useCallback } from "react";
import CustomTable from "../CustomTable";
import CustomPagination from "../CustomPagination";
import SearchBar from "../SearchBar";
import {
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import DeleteMaintenances from "./DeleteMaintenances";
import { AddMaintenances } from "./AddMaintenances";
import EditMaintenance from "./EditMaintenances";
import { Button } from "@heroui/button";
import { downloadMaintenances } from "@/lib/data";
import { useUrlSort } from "@/hooks/useUrlSort";
import {
  MAINTENANCE_DICTIONARY,
  MAINTENANCE_FREQUENCY_DICTIONARY,
  MAINTENANCE_PRIORITY_DICTIONARY,
  MAINTENANCE_STATUS_DICTIONARY,
} from "@/constants/maintenance";

const MaintenancesPage = ({
  columns,
  data,
  meta,
}: {
  columns: IColumn[];
  data: IMaintenance[];
  meta: IPagination;
}) => {
  const { sortDescriptor, setSortDescriptor } = useUrlSort("name");

  const renderCell = useCallback((data: IMaintenance, columnKey: React.Key) => {
    const cellValue = data[columnKey as keyof IMaintenance] || "No aplica";

    switch (columnKey) {
      case "asset.name":
        return <div>{data?.asset?.name || "No aplica"}</div>;
      case "technician.name":
        return <div>{data?.technician?.name || "No aplica"}</div>;
      case "scheduledDate":
        return (
          <div>
            {data?.scheduledDate
              ? formatDateUTC(data?.scheduledDate, "dd/MM/yyyy")
              : "No aplica"}
          </div>
        );
      case "alertDaysBefore":
        return <div>{`${cellValue} día${cellValue === 1 ? "" : "s"}`}</div>;
      case "provider.name":
        return <div>{data?.provider?.name || "No aplica"}</div>;
      case "estimatedCost":
        return <div>{amountFormatter(data?.estimatedCost || 0)}</div>;
      case "maintenanceType":
        return <div>{MAINTENANCE_DICTIONARY[data?.maintenanceType]}</div>;
      case "status":
        return <div>{MAINTENANCE_STATUS_DICTIONARY[data?.status]}</div>;
      case "frequency":
        return <div>{MAINTENANCE_FREQUENCY_DICTIONARY[data?.frequency]}</div>;
      case "priority":
        return <div>{MAINTENANCE_PRIORITY_DICTIONARY[data?.priority]}</div>;
      case "actions":
        return (
          <div className="relative flex justify-end items-center">
            <EditMaintenance maintenance={data} />
            <DeleteMaintenances maintenance={data} />
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
                  key: "maintenanceCode",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "maintenanceType",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "description",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "frequency",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "priority",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "status",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "responsible",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "technician",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "alertDaysBefore",
                  value: term,
                  operator: "empty",
                  valueType: "int",
                },
                {
                  key: "provider.name",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "asset.name",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "estimatedCost",
                  value: term,
                  operator: "empty",
                  valueType: "int",
                },
              ]}
            />
            <div className="flex w-full gap-3 justify-end">
              <AddMaintenances />
              <Button
                color="secondary"
                className="w-full md:w-auto"
                onPress={async () => {
                  const response = await downloadMaintenances();
                  downloadBlob(response, "maintenances.xlsx");
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

export default MaintenancesPage;
