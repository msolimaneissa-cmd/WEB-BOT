import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from 'shared';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      error: 'Validation Error',
      message: Object.values((err as any).errors)
        .map((e: any) => e.message)
        .join(', '),
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const response: ApiResponse = {
      success: false,
      error: 'Duplicate Key Error',
      message: 'A record with this value already exists',
    };
    res.status(400).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid Token',
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      error: 'Token Expired',
    };
    res.status(401).json(response);
    return;
  }

  // Default error
  console.error('Unhandled Error:', err);
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,
  };
  res.status(500).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
