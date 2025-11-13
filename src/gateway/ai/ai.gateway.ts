import { post } from "src/lib/apiClient";
import { IsMetalizedResponse } from "./metalized.response";
import { MetalizedRequest } from "./meatalized.request";
import * as https from "https";
const FormData = require("form-data");

// Helper function to check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;

  // Check for network errors that might be transient
  const retryableCodes = [
    "ETIMEDOUT",
    "ENETUNREACH",
    "ECONNREFUSED",
    "ECONNRESET",
    "EAI_AGAIN",
  ];

  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Check AggregateError for retryable codes
  if (error.name === "AggregateError" && error.errors) {
    return error.errors.some(
      (e: any) => e.code && retryableCodes.includes(e.code)
    );
  }

  return false;
};

// Helper function to sleep/delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isMetalised = async (
  file: Express.Multer.File,
  retries: number = 3
): Promise<IsMetalizedResponse> => {
  // Ensure httpsAgent is used for SSL/TLS connections
  const allowInsecure = process.env.AI_ALLOW_INSECURE === "true";
  const httpsAgent = allowInsecure
    ? new https.Agent({ rejectUnauthorized: false })
    : new https.Agent();

  // Increased timeout for file uploads (30 seconds)
  const uploadTimeout = process.env.AI_UPLOAD_TIMEOUT_MS
    ? Number(process.env.AI_UPLOAD_TIMEOUT_MS)
    : 30000;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create a new FormData instance for each attempt (required for retries)
      const form = new FormData();
      form.append("file", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype || "application/octet-stream",
      });

      const response = await post<IsMetalizedResponse, any>(
        "/detect-metalized",
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          httpsAgent,
          timeout: uploadTimeout,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );
      return response.data;
    } catch (error) {
      lastError = error;

      // Check if error is retryable and we have retries left
      if (attempt < retries && isRetryableError(error)) {
        // Exponential backoff: wait 1s, 2s, 4s, etc.
        const delayMs = Math.pow(2, attempt) * 1000;
        await sleep(delayMs);
        continue; // Retry
      }

      // If not retryable or out of retries, break and throw
      break;
    }
  }

  // All retries exhausted or non-retryable error
  if (!lastError) {
    throw new Error("Unknown error occurred during AI service request");
  }

  const error = lastError;

  // Handle AggregateError (may contain multiple errors)
  if (error.name === "AggregateError" && error.errors) {
    const errorMessages = error.errors
      .map((e: any) => `${e.message || "Unknown"} (${e.code || "no code"})`)
      .join("; ");
    throw new Error(
      `AI Service connection failed after ${
        retries + 1
      } attempts. ${errorMessages}`
    );
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
    if (error.cause) errorDetails.push(`Cause: ${JSON.stringify(error.cause)}`);
    if (error.name) errorDetails.push(`Name: ${error.name}`);

    // Get baseURL from environment
    const baseURL =
      process.env.AI_BASE_URL ||
      process.env.AI_SERVICE_URL ||
      "http://localhost:8000";
    errorDetails.push(`Target URL: ${baseURL}/detect-metalized`);
    errorDetails.push(`Attempts: ${retries + 1}`);

    throw new Error(
      `No response from AI Service after ${
        retries + 1
      } attempts. ${errorDetails.join(" | ")}`
    );
  } else {
    // Something happened in setting up the request that triggered an Error
    const errorDetails: string[] = [];
    errorDetails.push(`Message: ${error.message || "Unknown error"}`);
    if (error.code) errorDetails.push(`Code: ${error.code}`);
    if (error.cause) errorDetails.push(`Cause: ${JSON.stringify(error.cause)}`);
    if (error.name) errorDetails.push(`Name: ${error.name}`);

    throw new Error(`Error setting up request: ${errorDetails.join(" | ")}`);
  }
};
