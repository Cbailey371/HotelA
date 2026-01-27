// ENUMS
export enum ProviderType {
  assets = "assets",
  spare_parts = "spare_parts",
  both = "both",
}

export enum AssetType {
  vehicle = "vehicle",
  machinery = "machinery",
  furniture = "furniture",
  electronic = "electronic",
  other = "other",
}

export enum AssetStatus {
  active = "active",
  inactive = "inactive",
  under_maintenance = "under_maintenance",
  decommissioned = "decommissioned",
}

export enum SparePartType {
  part = "part",
  consumable = "consumable",
  electric = "electric",
  mechanic = "mechanic",
  electronic = "electronic",
}

export enum MaintenanceType {
  preventive = "preventive",
  corrective = "corrective",
}

export enum MaintenanceStatus {
  pending = "pending",
  completed = "completed",
  cancelled = "cancelled",
}

export enum Frequency {
  daily = "daily",
  weekly = "weekly",
  monthly = "monthly",
  quarterly = "quarterly",
  biannually = "biannually",
  annually = "annually",
}

export enum Priority {
  low = "low",
  medium = "medium",
  high = "high",
  critical = "critical",
}

export interface IPagination {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number | null;
  prev: number | null;
  next: number | null;
}

export interface IPaginationResponse<T> {
  data?: T;
  meta?: IPagination;
}

export interface IParams {
  page?: number;
  where?: IWhere;
  perPage?: number;
  orderBy?: `${string}: ${"asc" | "desc"}` | `${string}: ${"asc" | "desc"}`[];
  select?: `${string}`[];
  include?: `${string}`[];
  operator?: "OR" | "AND" | "NOT" | "in";
  langCode?: string;
}

export type IWhere =
  | {
      key: string;
      value: string | string[];
      valueType?: "int" | "float" | "string" | "date" | "array" | "boolean";
      operator?:
        | ""
        | "empty"
        | "in"
        | "lt"
        | "lte"
        | "gt"
        | "gte"
        | "equals"
        | "not"
        | "contains"
        | "startsWith"
        | "endsWith"
        | "every"
        | "some"
        | "none"
        | "has";
    }[]
  | {
      key: string;
      value: string | string[];
      valueType?: "int" | "float" | "string" | "date" | "array" | "boolean";
      contains?: boolean;
      operator?:
        | ""
        | "empty"
        | "in"
        | "lt"
        | "lte"
        | "gt"
        | "gte"
        | "equals"
        | "not"
        | "contains"
        | "startsWith"
        | "endsWith"
        | "every"
        | "some"
        | "none"
        | "has";
    }
  | null;

export interface IColumn {
  name: string;
  uid: string;
  sortable?: boolean;
}

export interface IUser {
  id: string;
  name: string;
  role: string;
  email: string;
  password?: string;
}

export interface ITechnician {
  id: string;
  name: string;
  email: string;
  phone: string;
  providerId?: string | null;
}

export interface IAsset {
  id: string;
  name: string;
  code: string;
  category: string;
  assetType: AssetType;
  model: string;
  brand: string;
  serialNumber: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  photoUrl?: string;
  manualUrl?: string;
  quantity: number;
  locationDetail?: string;
  responsible: string;
  acquisitionDate: string | Date;
  installationDate?: string | Date;
  decommissionDate?: string | Date;
  providerId: string;
  provider: IProvider;
  value: number;
  usefulLife: number;
  status: AssetStatus;
  notes: string;
  hotelId: string;
  locationId: string;
  location: ILocation;
  createdAt: string;
  updatedAt: string;
}

export interface IReplacement {
  id: string;
  name: string;
  assetId: string;
  asset?: IAsset;
  sparePartType: SparePartType;
  model: string;
  brand: string;
  year?: number;
  photoUrl?: string;
  availableQuantity: number;
  minimumStock: number;
  estimatedUsefulLife: number;
  lastPurchaseDate: string | Date;
  installationDate?: string | Date;
  expirationDate?: string | Date;
  storageLocation: string;
  exactPhysicalLocation: string;
  providerId: string;
  provider?: IProvider;
  unitCost: number;
  compatibilityModels: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILocation {
  id: string;
  name: string;
  description: string;
  hotelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProvider {
  id: string;
  name: string;
  taxId: string;
  mainContact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  providerType: ProviderType;
  paymentMethods?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMaintenance {
  id: string;
  assetId: string;
  asset?: IAsset;
  maintenanceCode: string;
  maintenanceType: MaintenanceType;
  description: string;
  scheduledDate: string | Date;
  frequency: Frequency;
  priority: Priority;
  responsible: string;
  status: MaintenanceStatus;
  estimatedCost: number;
  alertDaysBefore: number;
  providerId: string;
  provider?: IProvider;
  technicianId: string;
  technician?: ITechnician;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
