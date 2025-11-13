import { post } from "src/lib/apiClient"
import { IsMetalizedResponse } from "./metalized.response"
import { MetalizedRequest } from "./meatalized.request"
import FormData from "form-data"
import https from "https"

export const isMetalised = async (file: Express.Multer.File): Promise<IsMetalizedResponse> => {
    const form = new FormData();
    form.append("file", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
    });

    const allowInsecure = process.env.AI_ALLOW_INSECURE === "true";
    const httpsAgent = allowInsecure
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined;

    const response = await post<IsMetalizedResponse, any>(
        "/detect-metalized",
        form,
        {
            headers: {
                ...form.getHeaders(),
            },
            httpsAgent,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        }
    );
    return response.data;
}