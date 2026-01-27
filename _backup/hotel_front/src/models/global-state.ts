import {
  IAsset,
  ILocation,
  INotification,
  IPaginationResponse,
  IProvider,
  ITechnician,
} from "@/lib/definitions";

export interface GlobalState {
  openSideNav: boolean;
  assets: IAsset[];
  providers: IProvider[];
  technicians: ITechnician[];
  locations: ILocation[];
  notifications: IPaginationResponse<INotification[]>;
}
