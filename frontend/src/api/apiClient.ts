import axios, { AxiosError, AxiosResponse } from "axios";

const apiClient = axios.create({
  baseURL: process.env.BACKEND_URL || "http://localhost:4000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status) {
      console.error(error.response.status);
    }
    return Promise.reject(error);
  },
);

// a template function because if we try to write multiple get functions for each get Api it is just straight up redundant, DRY
export const getRequest = async <T>(url: string): Promise<T> => {
  const response = await apiClient.get<T>(url);
  return response.data;
};

export default apiClient;
