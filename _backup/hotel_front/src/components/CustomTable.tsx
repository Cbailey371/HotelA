import React from "react";
import { Table, type TableProps } from "@heroui/table";

const CustomTable: React.FC<TableProps> = ({ ...props }) => {
  return (
    <Table
      isHeaderSticky
      bottomContentPlacement="outside"
      selectionMode="none"
      topContentPlacement="outside"
      isStriped
      classNames={{
        // wrapper: "border border-gray-300",
        // table: "border-collapse table-fixed text-sm",
        th: "bg-primary text-white font-semibold text-left px-3 py-2 uppercase",
        td: "px-3 py-2 border border-gray-200 text-gray-700",
        tr: "hover:bg-gray-100",
      }}
      {...props}
    />
  );
};

export default CustomTable;
