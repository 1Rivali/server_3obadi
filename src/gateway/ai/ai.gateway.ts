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
    // Handle AggregateError (may contain multiple errors)
    if (error.name === "AggregateError" && error.errors) {
      const errorMessages = error.errors
        .map((e: any) => `${e.message || "Unknown"} (${e.code || "no code"})`)
        .join("; ");
      throw new Error(`AggregateError from AI Service: ${errorMessages}`);
    }

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
      const errorDetails: string[] = [];
      errorDetails.push(`Message: ${error.message || "Unknown error"}`);
      if (error.code) errorDetails.push(`Code: ${error.code}`);
      if (error.cause)
        errorDetails.push(`Cause: ${JSON.stringify(error.cause)}`);
      if (error.name) errorDetails.push(`Name: ${error.name}`);

      // Get baseURL from environment
      const baseURL =
        process.env.AI_BASE_URL ||
        process.env.AI_SERVICE_URL ||
        "https://ai.3tech.sy";
      errorDetails.push(`Target URL: ${baseURL}/detect-metalized`);

      throw new Error(
        `No response from AI Service. ${errorDetails.join(" | ")}`
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      const errorDetails: string[] = [];
      errorDetails.push(`Message: ${error.message || "Unknown error"}`);
      if (error.code) errorDetails.push(`Code: ${error.code}`);
      if (error.cause)
        errorDetails.push(`Cause: ${JSON.stringify(error.cause)}`);
      if (error.name) errorDetails.push(`Name: ${error.name}`);

      throw new Error(`Error setting up request: ${errorDetails.join(" | ")}`);
    }
  }
};
