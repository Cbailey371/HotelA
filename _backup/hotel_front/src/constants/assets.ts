import { AssetStatus, AssetType } from "@/lib/definitions";

export const ASSET_TYPES = [
  { value: AssetType.vehicle, label: "Vehiculo" },
  { value: AssetType.machinery, label: "Maquinaria" },
  { value: AssetType.electronic, label: "Electronico" },
  { value: AssetType.furniture, label: "Muebles" },
  { value: AssetType.other, label: "Otros" },
];

export const ASSET_STATUSES = [
  { value: AssetStatus.active, label: "Activo" },
  { value: AssetStatus.inactive, label: "Inactivo" },
  { value: AssetStatus.under_maintenance, label: "En Mantenimiento" },
  { value: AssetStatus.decommissioned, label: "Baja" },
];

export const ASSET_DICTIONARY = {
  [AssetType.vehicle]: "Vehículo",
  [AssetType.machinery]: "Máquinaria",
  [AssetType.electronic]: "Electrónico",
  [AssetType.furniture]: "Muebles",
  [AssetType.other]: "Otros",
};

export const ASSET_STATUS_DICTIONARY = {
  [AssetStatus.active]: "Activo",
  [AssetStatus.inactive]: "Inactivo",
  [AssetStatus.under_maintenance]: "En Mantenimiento",
  [AssetStatus.decommissioned]: "Baja",
};
