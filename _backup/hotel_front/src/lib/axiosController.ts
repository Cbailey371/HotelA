import { auth } from "@/auth";
import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from "axios";
import { getSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

const baseURL = process.env.ROOT_API as string;

const ApiClient = () => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use(
    async (request) => {
      let session: any;
      if (typeof window != "undefined") {
        session = await getSession();
      } else {
        session = await auth();
      }
      if (session) {
        request.headers.Authorization = `Bearer ${session?.user?.accessToken}`;
      }
      return request;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // console.log(error)
      if (error.response?.status === 403) {
        if (typeof window !== "undefined") {
          signOut();
        } else {
          redirect("/login");
        }
      }
      return error.response;
    }
  );

  return instance;
};

const apiClient = ApiClient();

async function request<T>(
  method: "get" | "post" | "delete" | "patch" | "put",
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await apiClient({
    method,
    url,
    data,
    ...config,
  });
  return response?.data;
}

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return request("get", url, undefined, config);
}

export async function post<T>(
  url: string,
  data: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return request("post", url, data, config);
}

export async function axiosDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return request("delete", url, undefined, config);
}

export async function patch<T>(
  url: string,
  data: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return request("patch", url, data, config);
}

export async function put<T>(
  url: string,
  data: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return request("put", url, data, config);
}
