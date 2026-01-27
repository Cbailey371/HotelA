import { ITechnician } from "@/lib/definitions";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import React from "react";

const TechnicianAutocomplete = ({
  technicians,
  value,
  onChange,
}: {
  technicians: ITechnician[];
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <Autocomplete
      label="Técnico"
      placeholder="Técnico"
      selectedKey={value}
      onSelectionChange={(e) => {
        onChange(e as string);
      }}
    >
      {technicians.map((technician) => (
        <AutocompleteItem key={technician.id}>
          {technician.name}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

export default TechnicianAutocomplete;
