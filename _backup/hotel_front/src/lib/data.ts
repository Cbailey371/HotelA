import toast from "react-hot-toast";
import { get, post } from "./axiosController";

export const downloadLocations = async () => {
  const response = await get<Blob>("/locations/download", {
    responseType: "blob",
  });
  return response;
};

export const downloadUsers = async () => {
  const response = await get<Blob>("/users/download", {
    responseType: "blob",
  });
  return response;
};

export const downloadProviders = async () => {
  const response = await get<Blob>("/providers/download", {
    responseType: "blob",
  });
  return response;
};

export const downloadReplacements = async () => {
  const response = await get<Blob>("/spare-parts/download", {
    responseType: "blob",
  });
  return response;
};

export const downloadAssets = async () => {
  const response = await get<Blob>("/assets/download", {
    responseType: "blob",
  });
  return response;
};

export const downloadMaintenances = async () => {
  const response = await get<Blob>("/maintenances/download", {
    responseType: "blob",
  });
  return response;
};

export const downloadTechnicians = async () => {
  const response = await get<Blob>("/technicians/download", {
    responseType: "blob",
  });
  return response;
};

export const uploadFile = async (file?: File) => {
  if (!file) return "";
  const formData = new FormData();
  formData.append("file", file);
  const response = await post<{
    url: {
      url: string;
      publicId: string;
    };
  }>("/file/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  if (!response?.url?.url) {
    toast.error("Error al subir el archivo");
    return "";
  }
  return response?.url?.url;
};
