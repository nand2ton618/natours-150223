import { NextFunction, Request, Response } from 'express'
import config from 'config'
import AppError from '../utils/appError.util'

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

const sendErrorProd = (err: AppError, res: Response) => {}

const errorController = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (config.get<string>('NODE_ENV') === 'development') {
    sendErrorDev(err, res)
  } else if (config.get<string>('NODE_ENV') === 'production') {
    sendErrorProd(err, res)
  }
}

export default errorController
