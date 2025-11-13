import axios, {
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
}

const apiClient = axios.create({
    baseURL: "https://ai.3tech.sy",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    (error) => {
        return Promise.reject(error);
    }
);

export const get = <T>(
    url: string,
    config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => apiClient.get<T>(url, config);

export const post = <T, U = unknown>(
    url: string,
    data?: U,
    config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => apiClient.post<T>(url, data, config);

export const put = <T, U = unknown>(
    url: string,
    data?: U,
    config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => apiClient.put<T>(url, data, config);

export const del = <T>(
    url: string,
    config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => apiClient.delete<T>(url, config);

export default {
    get,
    post,
    put,
    del,
};
