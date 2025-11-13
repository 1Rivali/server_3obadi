import { post } from "src/lib/apiClient";
import { IsMetalizedResponse } from "./metalized.response";
import { MetalizedRequest } from "./meatalized.request";
import { Logger } from "@nestjs/common";
import FormData = require("form-data");
import https from "https";
import { AxiosError } from "axios";

const logger = new Logger("AIGateway");

export const isMetalised = async (
  file: Express.Multer.File
): Promise<IsMetalizedResponse> => {
  const form = new FormData();
  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const allowInsecure = process.env.AI_ALLOW_INSECURE === "true";
  const httpsAgent = allowInsecure
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

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
    const axiosError = error as AxiosError;

    if (axiosError.code === "ECONNREFUSED" || axiosError.code === "ETIMEDOUT") {
      logger.error(
        `AI service connection failed: ${axiosError.message}`,
        axiosError.stack
      );
      throw new Error(
        "AI service is currently unavailable. Please try again later."
      );
    }

    if (axiosError.code === "ENOTFOUND") {
      logger.error(
        `AI service host not found: ${axiosError.message}`,
        axiosError.stack
      );
      throw new Error(
        "AI service host is not reachable. Please check the configuration."
      );
    }

    if (axiosError.code === "ECONNRESET" || axiosError.code === "EPIPE") {
      logger.error(
        `AI service connection reset: ${axiosError.message}`,
        axiosError.stack
      );
      throw new Error(
        "Connection to AI service was interrupted. Please try again."
      );
    }

    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error(
        `AI service returned error: ${axiosError.response.status} - ${axiosError.response.statusText}`
      );
      throw new Error(
        `AI service error: ${axiosError.response.status} ${axiosError.response.statusText}`
      );
    }

    if (axiosError.request) {
      // The request was made but no response was received
      logger.error(
        `No response from AI service: ${axiosError.message}`,
        axiosError.stack
      );
      throw new Error("AI service did not respond. Please try again later.");
    }

    // Something happened in setting up the request that triggered an Error
    logger.error(
      `Error setting up AI service request: ${axiosError.message}`,
      axiosError.stack
    );
    throw new Error(`Failed to process image: ${axiosError.message}`);
  }
};
