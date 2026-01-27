"use client";
import { IColumn, IPagination, IProvider } from "@/lib/definitions";
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
import CustomTable from "../CustomTable";
import { AddProvider } from "./AddProvider";
import DeleteProvider from "./DeleteProvider";
import { EditProvider } from "./EditProvider";
import { Button } from "@heroui/button";
import { downloadBlob } from "@/lib/utils";
import { downloadProviders } from "@/lib/data";
import { useUrlSort } from "@/hooks/useUrlSort";
import { PROVIDER_DICTIONARY } from "@/constants/provider";

const ProvidersPage = ({
  columns,
  data,
  meta,
}: {
  columns: IColumn[];
  data: IProvider[];
  meta: IPagination;
}) => {
  const { sortDescriptor, setSortDescriptor } = useUrlSort("name");

  const renderCell = useCallback((data: IProvider, columnKey: React.Key) => {
    const cellValue = data[columnKey as keyof IProvider] || "No aplica";

    switch (columnKey) {
      case "providerType":
        return PROVIDER_DICTIONARY[data.providerType];
      case "actions":
        return (
          <div className="relative flex justify-end items-center">
            <EditProvider provider={data} />
            <DeleteProvider provider={data} />
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
                  key: "taxId",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "mainContact",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "phone",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "email",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "address",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "city",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "country",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "website",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "providerType",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "paymentMethods",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "notes",
                  value: term,
                  operator: "contains",
                },
              ]}
            />
            <div className="flex w-full gap-3 justify-end">
              <AddProvider />
              <Button
                color="secondary"
                className="w-full md:w-auto"
                onPress={async () => {
                  const response = await downloadProviders();
                  downloadBlob(response, "providers.xlsx");
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
            className="min-w-40"
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

export default ProvidersPage;
