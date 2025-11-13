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

    // Handle AggregateError (can contain multiple errors)
    let errorCode = axiosError.code;
    let underlyingError: any = null;
    let errorMessage = axiosError.message;

    // Check if it's an AggregateError
    if (
      error instanceof Error &&
      "errors" in error &&
      Array.isArray((error as any).errors)
    ) {
      // This is an AggregateError
      const aggregateError = error as any;
      const errors = aggregateError.errors || [];
      underlyingError = errors[0];

      // Try to extract error code from nested errors
      for (const err of errors) {
        if (err?.code) {
          errorCode = err.code;
          break;
        }
        if (err?.errno) {
          // Map errno to error code if available
          errorCode = err.code || errorCode;
        }
      }

      // Extract more detailed message from nested errors
      if (errors.length > 0 && errors[0]?.message) {
        errorMessage = errors[0].message;
      }

      logger.error(`AggregateError detected with ${errors.length} errors`, {
        errors: errors.map((e: any) => ({
          code: e?.code,
          errno: e?.errno,
          message: e?.message,
          syscall: e?.syscall,
        })),
        stack: error.stack,
      });
    }

    // Check the cause property if it exists (Node.js 16.9.0+)
    if (!errorCode && (error as any).cause) {
      underlyingError = (error as any).cause;
      errorCode = underlyingError?.code || underlyingError?.errno || errorCode;
      if (underlyingError?.message) {
        errorMessage = underlyingError.message;
      }
    }

    // Try to extract from the original error if it's not an AxiosError
    if (!errorCode && (error as any).errno) {
      errorCode = (error as any).code;
    }

    // Log detailed error information
    logger.error(
      `AI service error - Code: ${errorCode || "unknown"}, Message: ${
        errorMessage || axiosError.message
      }`,
      {
        code: errorCode,
        message: errorMessage || axiosError.message,
        originalMessage: axiosError.message,
        stack: axiosError.stack,
        underlyingError: underlyingError,
        response: axiosError.response
          ? {
              status: axiosError.response.status,
              statusText: axiosError.response.statusText,
            }
          : undefined,
      }
    );

    // Handle specific error codes
    if (errorCode === "ECONNREFUSED" || errorCode === "ETIMEDOUT") {
      throw new Error(
        "AI service is currently unavailable. Please try again later."
      );
    }

    if (errorCode === "ENOTFOUND") {
      throw new Error(
        "AI service host is not reachable. Please check the configuration."
      );
    }

    if (errorCode === "ECONNRESET" || errorCode === "EPIPE") {
      throw new Error(
        "Connection to AI service was interrupted. Please try again."
      );
    }

    // Handle TLS/SSL errors
    if (
      errorCode === "CERT_HAS_EXPIRED" ||
      errorCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
      errorCode === "SELF_SIGNED_CERT_IN_CHAIN" ||
      errorCode === "DEPTH_ZERO_SELF_SIGNED_CERT"
    ) {
      logger.warn(
        `SSL/TLS certificate error: ${errorCode}. Consider setting AI_ALLOW_INSECURE=true if using self-signed certificates.`
      );
      throw new Error(
        "AI service SSL certificate error. Please check the configuration."
      );
    }

    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `AI service error: ${axiosError.response.status} ${axiosError.response.statusText}`
      );
    }

    if (axiosError.request) {
      // The request was made but no response was received
      throw new Error("AI service did not respond. Please try again later.");
    }

    // Something happened in setting up the request that triggered an Error
    throw new Error(
      `Failed to process image: ${
        errorMessage || axiosError.message || "Unknown error"
      }`
    );
  }
};
