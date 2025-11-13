import { post } from "src/lib/apiClient";
import { IsMetalizedResponse } from "./metalized.response";
import { MetalizedRequest } from "./meatalized.request";

import https from "https";

export const isMetalised = async (
  file: Express.Multer.File
): Promise<IsMetalizedResponse> => {
  const form = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype });

  // Append the file with original filename
  form.append("file", blob, file.originalname);

  const allowInsecure = process.env.AI_ALLOW_INSECURE === "true";
  const httpsAgent = allowInsecure
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

  const response = await post<IsMetalizedResponse, any>(
    "/detect-metalized",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
