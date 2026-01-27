"use client";
import React, { useMemo } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { CountryRegionData } from "react-country-region-selector";

type CountrySelectProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (event: any) => void;
  defaultOptionLabel?: string;
  isInvalid?: boolean;
  label?: string;
};

const CountrySelect = ({
  value,
  onChange,
  onBlur,
  defaultOptionLabel = "Selecciona un país",
  isInvalid,
  label,
}: CountrySelectProps) => {
  const countries = useMemo(
    () =>
      CountryRegionData.default.map(([name, code]) => ({
        key: name,
        label: name,
        code,
      })),
    []
  );

  return (
    <Autocomplete
      className={`w-full ${isInvalid ? "text-red-500" : "text-gray-700"}`}
      defaultItems={countries}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as string)}
      onBlur={onBlur}
      label={label}
      placeholder={defaultOptionLabel}
    >
      {(item) => (
        <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>
      )}
    </Autocomplete>
  );
};

export default CountrySelect;
