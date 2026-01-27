"use client";
import { IColumn, IPagination, IAsset } from "@/lib/definitions";
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
import CustomTable from "../CustomTable";
import AddAsset from "./AddAsset";
import DeleteAsset from "./DeleteAsset";
import EditAsset from "./EditAsset";
import { Button } from "@heroui/button";
import { downloadAssets } from "@/lib/data";
import { useUrlSort } from "@/hooks/useUrlSort";
import { ASSET_DICTIONARY, ASSET_STATUS_DICTIONARY } from "@/constants/assets";

const AssetsPage = ({
  columns,
  data,
  meta,
}: {
  columns: IColumn[];
  data: IAsset[];
  meta: IPagination;
}) => {
  const { sortDescriptor, setSortDescriptor } = useUrlSort("name");

  const renderCell = useCallback((data: IAsset, columnKey: React.Key) => {
    const cellValue = data[columnKey as keyof IAsset] || "No aplica";

    switch (columnKey) {
      case "photoUrl":
        return (
          <div className="flex justify-center">
            {data?.photoUrl ? (
              <img
                src={data?.photoUrl}
                alt="Foto"
                className="w-12 h-12 object-cover rounded-md"
              />
            ) : (
              <span className="icon-[tabler--photo] text-4xl" />
            )}
          </div>
        );
      case "location.name":
        return <div>{data?.location?.name || "No aplica"}</div>;
      case "acquisitionDate":
        return (
          <div>
            {data?.acquisitionDate
              ? formatDateUTC(data?.acquisitionDate, "dd/MM/yyyy")
              : "No aplica"}
          </div>
        );
      case "installationDate":
        return (
          <div>
            {data?.installationDate
              ? formatDateUTC(data?.installationDate, "dd/MM/yyyy")
              : "No aplica"}
          </div>
        );
      case "decommissionDate":
        return (
          <div>
            {data?.decommissionDate
              ? formatDateUTC(data?.decommissionDate, "dd/MM/yyyy")
              : "No aplica"}
          </div>
        );
      case "provider.name":
        return <div>{data?.provider?.name || "No aplica"}</div>;
      case "value":
        return <div>{amountFormatter(data?.value || 0)}</div>;
      case "usefulLife":
        return <div>{`${cellValue} meses`}</div>;
      case "assetType":
        return ASSET_DICTIONARY[data.assetType];
      case "status":
        return ASSET_STATUS_DICTIONARY[data.status];
      case "actions":
        return (
          <div className="relative flex justify-end items-center">
            <EditAsset asset={data} />
            <DeleteAsset asset={data} />
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
                  key: "code",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "category",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "assetType",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "locationDetail",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "location.name",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "brand",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "model",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "serialNumber",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "year",
                  value: term,
                  operator: "empty",
                  valueType: "int",
                },
                {
                  key: "color",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "engineNumber",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "chassisNumber",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "responsible",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "provider.name",
                  value: term,
                  operator: "contains",
                },
                {
                  key: "value",
                  value: term,
                  operator: "empty",
                  valueType: "int",
                },
                {
                  key: "notes",
                  value: term,
                  operator: "contains",
                },
              ]}
            />
            <div className="flex w-full gap-3 justify-end">
              <AddAsset />
              <Button
                color="secondary"
                className="w-full md:w-auto"
                onPress={async () => {
                  const response = await downloadAssets();
                  downloadBlob(response, "assets.xlsx");
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

export default AssetsPage;
