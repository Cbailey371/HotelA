"use client";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import React from "react";
import { RegionDropdown } from "react-country-region-selector";

const customRender = ({ options, customProps, ...selectProps }: any) => {
  return (
    <Autocomplete {...selectProps} {...customProps}>
      {options.map(({ label }: any) => (
        <AutocompleteItem key={label}>{label}</AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

const RegionSelect = ({
  value,
  onChange,
  onBlur,
  country,
  blankOptionLabel = "No hay un país seleccionado",
  defaultOptionLabel = "Selecciona una ciudad",
  isInvalid,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (event: any) => void;
  country: string;
  blankOptionLabel?: string;
  defaultOptionLabel?: string;
  isInvalid?: boolean;
  label?: string;
}) => {
  return (
    <RegionDropdown
      country={country}
      value={value}
      onChange={onChange}
      onBlur={onBlur as any}
      disableWhenEmpty={true}
      blankOptionLabel={blankOptionLabel}
      defaultOptionLabel={defaultOptionLabel}
      customRender={customRender}
      customProps={{
        label,
        isInvalid,
        selectedKey: value,
        onSelectionChange: onChange,
      }}
    />
  );
};

export default RegionSelect;
