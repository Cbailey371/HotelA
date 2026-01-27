"use client";
import { IReplacement, IColumn, IPagination } from "@/lib/definitions";
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
import { amountFormatter, downloadBlob, formatDateUTC } from "@/lib/utils";
import { AddReplacement } from "./AddReplacement";
import DeleteReplacement from "./DeleteReplacement";
import { EditReplacement } from "./EditReplacements";
import CustomTable from "../CustomTable";
import { Button } from "@heroui/button";
import { downloadReplacements } from "@/lib/data";
import { useUrlSort } from "@/hooks/useUrlSort";
import { REPLACEMENTS_DICTIONARY } from "@/constants/replacements";

const ReplacementsPage = ({
  columns,
  data,
  meta,
}: {
  columns: IColumn[];
  data: IReplacement[];
  meta: IPagination;
}) => {
  const { sortDescriptor, setSortDescriptor } = useUrlSort("name");

  const renderCell = useCallback((data: IReplacement, columnKey: React.Key) => {
    const cellValue = data[columnKey as keyof IReplacement] || "No aplica";

    switch (columnKey) {
      case "asset.name":
        return <div>{data?.asset?.name || "No aplica"}</div>;
      case "lastPurchaseDate":
        return (
          <div>
            {data?.lastPurchaseDate
              ? formatDateUTC(data?.lastPurchaseDate, "dd/MM/yyyy")
              : "No aplica"}
          </div>
        );
      case "estimatedUsefulLife":
        return <div>{`${cellValue} meses`}</div>;
      case "installationDate":
        return (
          <div>
            {data?.installationDate
              ? formatDateUTC(data?.installationDate, "dd/MM/yyyy")
              : "No aplica"}
          </div>
        );
      case "expirationDate":
        return (
          <div>
            {data?.expirationDate
              ? formatDateUTC(data?.expirationDate, "dd/MM/yyyy")
              : "No aplica"}
          </div>
        );
      case "provider.name":
        return <div>{data?.provider?.name || "No aplica"}</div>;
      case "unitCost":
        return <div>{amountFormatter(data?.unitCost || 0)}</div>;
      case "sparePartType":
        return <div>{REPLACEMENTS_DICTIONARY[data?.sparePartType]}</div>;
      case "actions":
        return (
          <div className="relative flex justify-end items-center">
            <EditReplacement replacement={data} />
            <DeleteReplacement replacement={data} />
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
                  key: "asset.name",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "sparePartType",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "model",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "brand",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "storageLocation",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "provider.name",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "unitCost",
                  value: term,
                  operator: "empty",
                  valueType: "int",
                },
                {
                  key: "exactPhysicalLocation",
                  value: term,
                  operator: "contains",
                },
              ]}
            />
            <div className="flex w-full gap-3 justify-end">
              <AddReplacement />
              <Button
                color="secondary"
                className="w-full md:w-auto"
                onPress={async () => {
                  const response = await downloadReplacements();
                  downloadBlob(response, "replacements.xlsx");
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

export default ReplacementsPage;
