import { SparePartType } from "@/lib/definitions";

export const REPLACEMENTS_TYPES: { label: string; value: SparePartType }[] = [
  {
    label: "Parte",
    value: SparePartType.part,
  },
  {
    label: "Consumible",
    value: SparePartType.consumable,
  },
  {
    label: "Electrico",
    value: SparePartType.electric,
  },
  {
    label: "Mecánico",
    value: SparePartType.mechanic,
  },
  {
    label: "Electrónico",
    value: SparePartType.electronic,
  },
];

export const REPLACEMENTS_DICTIONARY = {
  [SparePartType.part]: "Parte",
  [SparePartType.consumable]: "Consumible",
  [SparePartType.electric]: "Electrónico",
  [SparePartType.mechanic]: "Mecánico",
  [SparePartType.electronic]: "Electrónico",
};
