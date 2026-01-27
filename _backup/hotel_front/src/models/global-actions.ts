import {
  IAsset,
  ILocation,
  INotification,
  IPaginationResponse,
  IProvider,
  ITechnician,
} from "@/lib/definitions";

export interface GlobalActions {
  setOpenSideNav: (open: boolean) => void;
  setAssets: (assets: IAsset[]) => void;
  setProviders: (providers: IProvider[]) => void;
  setTechnicians: (technicians: ITechnician[]) => void;
  setLocations: (locations: ILocation[]) => void;
  setNotifications: (
    notifications: IPaginationResponse<INotification[]>
  ) => void;
}
