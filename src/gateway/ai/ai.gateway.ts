import { post } from "src/lib/apiClient";
import { IsMetalizedResponse } from "./metalized.response";
import { MetalizedRequest } from "./meatalized.request";
import FormData from "form-data";

export const isMetalised = async (
  file: Express.Multer.File
): Promise<IsMetalizedResponse> => {
  const form = new FormData();

  // Append the file with original filename and mimetype
  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype || "application/octet-stream",
  });

  const response = await post<IsMetalizedResponse, any>(
    "/detect-metalized",
    form,
    {
      headers: form.getHeaders(),
    }
  );
  return response.data;
};
