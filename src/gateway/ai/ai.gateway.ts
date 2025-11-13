import { post } from "src/lib/apiClient"
import { IsMetalizedResponse } from "./metalized.response"
import { MetalizedRequest } from "./meatalized.request"

export const isMetalised = async (file: Express.Multer.File): Promise<IsMetalizedResponse> => {
    const response = await post<IsMetalizedResponse, MetalizedRequest>("/detect-metalized", { file });
    return response.data;
}