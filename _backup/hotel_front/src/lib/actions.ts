"use server";

import { revalidatePath } from "next/cache";
import { axiosDelete, get, patch, post } from "./axiosController";
import {
  IAsset,
  ILocation,
  IMaintenance,
  INotification,
  IPaginationResponse,
  IParams,
  IProvider,
  IReplacement,
  ITechnician,
  IUser,
} from "./definitions";
import { buildParamsUrl } from "./utils";
import toast from "react-hot-toast";

export const revalidateClientPath = async (path?: string) => {
  try {
    if (path) {
      revalidatePath(path);
    } else {
      revalidatePath("/");
    }
  } catch (error) {
    console.error("revalidateClientPath=> ", error);
  }
};

export const getNotifications = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);
  const response: IPaginationResponse<INotification[]> = await get(
    `/notifications${formatedParams}`
  );
  return response;
};

export const deleteNotification = async (notificationId: string) => {
  const response: IPaginationResponse<INotification[]> = await axiosDelete(
    `/notifications/${notificationId}`
  );
  return response;
};

export const updateNotification = async (
  notificationId: string,
  data: Partial<INotification>
) => {
  const response: IPaginationResponse<INotification[]> = await patch(
    `/notifications/${notificationId}`,
    data
  );
  return response;
};

// Locations CRUD

export const getLocations = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);

  const response = await get<IPaginationResponse<ILocation[]>>(
    `/locations${formatedParams}`
  );
  return response;
};

export const createLocation = async (data: Partial<ILocation>) => {
  const response = await post<ILocation>("/locations", data);
  return response;
};

export const updateLocation = async (id: string, data: Partial<ILocation>) => {
  const response = await patch<ILocation>(`/locations/${id}`, data);
  return response;
};

export const deleteLocation = async (id: string) => {
  const response = await axiosDelete<ILocation>(`/locations/${id}`);
  return response;
};

// Users CRUD

export const getUsers = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);
  const response = await get<IPaginationResponse<IUser[]>>(
    `/users${formatedParams}`
  );
  return response;
};

export const createUser = async (data: Partial<IUser>) => {
  const response = await post<IUser>("/users", data);
  return response;
};

export const updateUser = async (id: string, data: Partial<IUser>) => {
  const response = await patch<IUser>(`/users/${id}`, data);
  return response;
};

export const deleteUser = async (id: string) => {
  const response = await axiosDelete<IUser>(`/users/${id}`);
  return response;
};

// Providers CRUD

export const getProviders = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);
  const response = await get<IPaginationResponse<IProvider[]>>(
    `/providers${formatedParams}`
  );
  return response;
};

export const createProvider = async (data: Partial<IProvider>) => {
  const response = await post<IProvider>("/providers", data);
  return response;
};

export const updateProvider = async (id: string, data: Partial<IProvider>) => {
  const response = await patch<IProvider>(`/providers/${id}`, data);
  return response;
};

export const deleteProvider = async (id: string) => {
  const response = await axiosDelete<IProvider>(`/providers/${id}`);
  return response;
};

// Replacements CRUD

export const getReplacements = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);
  const response = await get<IPaginationResponse<IReplacement[]>>(
    `/spare-parts${formatedParams}`
  );
  return response;
};

export const createReplacement = async (data: Partial<IReplacement>) => {
  const response = await post<IReplacement>("/spare-parts", data);
  return response;
};

export const updateReplacement = async (
  id: string,
  data: Partial<IReplacement>
) => {
  const response = await patch<IReplacement>(`/spare-parts/${id}`, data);
  return response;
};

export const deleteReplacement = async (id: string) => {
  const response = await axiosDelete<IReplacement>(`/spare-parts/${id}`);
  return response;
};

// Assets CRUD

export const getAssets = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);
  const response = await get<IPaginationResponse<IAsset[]>>(
    `/assets${formatedParams}`
  );
  return response;
};

export const createAsset = async (data: Partial<IAsset>) => {
  const response = await post<IAsset>("/assets", data);
  return response;
};

export const updateAsset = async (id: string, data: Partial<IAsset>) => {
  const response = await patch<IAsset>(`/assets/${id}`, data);
  return response;
};

export const deleteAsset = async (id: string) => {
  const response = await axiosDelete<IAsset>(`/assets/${id}`);
  return response;
};

// Maintenance CRUD

export const getMaintenances = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);
  const response = await get<IPaginationResponse<IMaintenance[]>>(
    `/maintenances${formatedParams}`
  );
  return response;
};

export const createMaintenance = async (data: Partial<IMaintenance>) => {
  const response = await post<IMaintenance>("/maintenances", data);
  return response;
};

export const updateMaintenance = async (
  id: string,
  data: Partial<IMaintenance>
) => {
  const response = await patch<IMaintenance>(`/maintenances/${id}`, data);
  return response;
};

export const deleteMaintenance = async (id: string) => {
  const response = await axiosDelete<IMaintenance>(`/maintenances/${id}`);
  return response;
};

// Technician CRUD

export const getTechnicians = async (params: IParams) => {
  const formatedParams = buildParamsUrl(params);
  const response = await get<IPaginationResponse<ITechnician[]>>(
    `/technicians${formatedParams}`
  );
  return response;
};

export const createTechnician = async (data: Partial<ITechnician>) => {
  const response = await post<ITechnician>("/technicians", data);
  return response;
};

export const updateTechnician = async (
  id: string,
  data: Partial<ITechnician>
) => {
  const response = await patch<ITechnician>(`/technicians/${id}`, data);
  return response;
};

export const deleteTechnician = async (id: string) => {
  const response = await axiosDelete<ITechnician>(`/technicians/${id}`);
  return response;
};

export const deleteFile = async (file?: string) => {
  if (!file) return true;
  const response = await post<{
    success: boolean;
  }>("/file/delete", {
    url: file,
  });
  return response?.success;
};
