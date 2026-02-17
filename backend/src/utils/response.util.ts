import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export const sendSuccess = <T = any>(
  res: Response,
  statusCode: number,
  data: T,
  message: string = "Success",
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: string[],
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  } as ApiResponse);
};
