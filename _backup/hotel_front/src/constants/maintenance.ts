import {
  Frequency,
  MaintenanceStatus,
  MaintenanceType,
  Priority,
} from "@/lib/definitions";

export const MAINTENANCE_TYPE = [
  { value: MaintenanceType.preventive, label: "Preventivo" },
  { value: MaintenanceType.corrective, label: "Correctivo" },
];

export const MAINTENANCE_STATUS = [
  { value: MaintenanceStatus.pending, label: "Pendiente" },
  { value: MaintenanceStatus.completed, label: "Completado" },
  { value: MaintenanceStatus.cancelled, label: "Cancelado" },
];

export const MAINTENANCE_FREQUENCY = [
  { value: Frequency.daily, label: "Diario" },
  { value: Frequency.weekly, label: "Semanal" },
  { value: Frequency.monthly, label: "Mensual" },
  { value: Frequency.quarterly, label: "Trimestral" },
  { value: Frequency.biannually, label: "Semestral" },
  { value: Frequency.annually, label: "Anual" },
];

export const MAINTENANCE_PRIORITY = [
  { value: Priority.low, label: "Bajo" },
  { value: Priority.medium, label: "Medio" },
  { value: Priority.high, label: "Alto" },
  { value: Priority.critical, label: "Crítico" },
];

export const MAINTENANCE_DICTIONARY = {
  [MaintenanceType.preventive]: "Preventivo",
  [MaintenanceType.corrective]: "Correctivo",
};

export const MAINTENANCE_STATUS_DICTIONARY = {
  [MaintenanceStatus.pending]: "Pendiente",
  [MaintenanceStatus.completed]: "Completado",
  [MaintenanceStatus.cancelled]: "Cancelado",
};

export const MAINTENANCE_FREQUENCY_DICTIONARY = {
  [Frequency.daily]: "Diario",
  [Frequency.weekly]: "Semanal",
  [Frequency.monthly]: "Mensual",
  [Frequency.quarterly]: "Trimestral",
  [Frequency.biannually]: "Semestral",
  [Frequency.annually]: "Anual",
};

export const MAINTENANCE_PRIORITY_DICTIONARY = {
  [Priority.low]: "Bajo",
  [Priority.medium]: "Medio",
  [Priority.high]: "Alto",
  [Priority.critical]: "Crítico",
};
