import { ProviderType } from "@/lib/definitions";

export const PROVIDER_TYPES = [
  { value: ProviderType.assets, label: "Activos" },
  { value: ProviderType.spare_parts, label: "Repuestos" },
  { value: ProviderType.both, label: "Ambos" },
];

export const PROVIDER_DICTIONARY = {
  [ProviderType.assets]: "Activos",
  [ProviderType.spare_parts]: "Repuestos",
  [ProviderType.both]: "Ambos",
};
