"use client";
import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationCursor,
  PaginationItem,
} from "@heroui/pagination";

function CustomPagination({
  totalPages,
  className,
}: {
  totalPages: number;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();
  const currentPage = Number(searchParams.get("page")) || 1;
  const paginationRef = useRef<HTMLDivElement>(null);

  const createPageUrl = (page: string | number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathName}?${params.toString()}`, { scroll: false });
    paginationRef?.current?.scrollIntoView({ behavior: "instant" });
  };

  return (
    <div ref={paginationRef} className={className}>
      <Pagination
        className="flex w-full justify-end"
        onChange={(page) => createPageUrl(page)}
        classNames={{
          cursor: "bg-primary",
        }}
        isCompact
        showControls
        total={totalPages}
        initialPage={currentPage}
      >
        <PaginationItem>
          <PaginationCursor />
        </PaginationItem>
      </Pagination>
    </div>
  );
}

export default CustomPagination;
