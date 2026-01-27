"use client";
import { IWhere } from "@/lib/definitions";
import { Input } from "@heroui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const WAIT_BETWEEN_CHANGE = 450;

const SearchBar = ({
  whereParamCallback,
}: {
  whereParamCallback: (term: string) => IWhere;
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const getValidWhereValue = (paramKey: string, defaultValue: string) => {
    const whereParam = searchParams.get("where");
    if (whereParam) {
      try {
        const { [paramKey]: value } = JSON.parse(whereParam);
        return value?.toString() ?? defaultValue;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const [searchTerm, setSearchTerm] = useState(getValidWhereValue("value", ""));

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      const whereParam = JSON.stringify(whereParamCallback(term));
      params.set("where", whereParam);
      params.set("operator", "OR");
    } else {
      params.delete("where");
      params.delete("operator");
    }
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  }, WAIT_BETWEEN_CHANGE);

  useEffect(() => {
    if (searchParams.get("where") || searchTerm) {
      handleSearch(searchTerm);
    }
  }, [searchTerm]);

  return (
    <Input
      onChange={(event) => setSearchTerm(event.target.value)}
      defaultValue={searchTerm}
      className="w-full sm:max-w-[44%]"
      startContent={
        <span className="icon-[whh--magnifier] text-xl text-gray-500" />
      }
      placeholder="Buscar"
    />
  );
};

export default SearchBar;
