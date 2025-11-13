import axios, {
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";
import * as http from "http";
import * as https from "https";

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
}

const baseURL = process.env.AI_BASE_URL || process.env.AI_SERVICE_URL || "https://ai.3tech.sy";
const timeout = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : 10000;
const allowInsecure = process.env.AI_ALLOW_INSECURE === "true";

const httpAgent = new http.Agent();
const httpsAgent = allowInsecure
    ? new https.Agent({ rejectUnauthorized: false })
    : new https.Agent();

const apiClient = axios.create({
    baseURL,
    timeout,
    // Do not set a global Content-Type; let axios infer it (e.g., FormData with boundary)
    httpAgent,
    httpsAgent,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
});

// apiClient.interceptors.request.use(
//     (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
//         const token = localStorage.getItem("token");
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

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
