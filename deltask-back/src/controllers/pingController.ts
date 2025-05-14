// src/controllers/pingController.ts
import { Request, Response } from 'express'

export function ping(_req: Request, res: Response) {
  res.json({ pong: true })
}
