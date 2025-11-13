import { post } from "src/lib/apiClient";
import { IsMetalizedResponse } from "./metalized.response";
import { MetalizedRequest } from "./meatalized.request";
import * as https from "https";
const FormData = require("form-data");

export const isMetalised = async (
  file: Express.Multer.File
): Promise<IsMetalizedResponse> => {
  const form = new FormData();

  // Append the file with original filename and mimetype
  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype || "application/octet-stream",
  });

  // Ensure httpsAgent is used for SSL/TLS connections
  const allowInsecure = process.env.AI_ALLOW_INSECURE === "true";
  const httpsAgent = allowInsecure
    ? new https.Agent({ rejectUnauthorized: false })
    : new https.Agent();

  try {
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
  } catch (error) {
    // Log more details about the error for debugging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `AI Service responded with status ${
          error.response.status
        }: ${JSON.stringify(error.response.data)}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(
        `No response from AI Service. Request details: ${error.message}`
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Error setting up request: ${error.message}`);
    }
  }
};
