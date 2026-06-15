import { Response } from 'express'

/** Send a standardized success envelope: { success: true, data } */
export const sendSuccess = (res: Response, data: unknown, status = 200): Response => {
  return res.status(status).json({ success: true, data })
}

/** Send a standardized success envelope with an additional message field. */
export const sendSuccessWithMessage = (
  res: Response,
  message: string,
  data?: unknown,
  status = 200
): Response => {
  return res.status(status).json({ success: true, message, data })
}

/** Send a standardized error envelope. Prefer throwing ApiError from inside controllers. */
export const sendError = (res: Response, message: string, status = 400): Response => {
  return res.status(status).json({ success: false, error: { message } })
}
