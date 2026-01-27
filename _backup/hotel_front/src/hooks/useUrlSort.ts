import { SortDescriptor } from "@heroui/table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type SortDirection = "ascending" | "descending";

export const useUrlSort = (
  defaultColumn = "name",
  defaultDirection: SortDirection = "ascending"
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const orderByParam =
    searchParams.get("orderBy") ||
    `${defaultColumn}:${defaultDirection === "descending" ? "desc" : "asc"}`;
  const [column, rawDirection] = orderByParam.split(":");
  const direction: SortDirection =
    rawDirection === "desc" ? "descending" : "ascending";

  const sortDescriptor: SortDescriptor = { column, direction };

  const setSortDescriptor = (descriptor: SortDescriptor) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set(
      "orderBy",
      `${descriptor.column}:${
        descriptor.direction === "descending" ? "desc" : "asc"
      }`
    );
    router.push(`${pathname}?${newParams.toString()}`);
  };

  return {
    sortDescriptor,
    setSortDescriptor,
  };
};
