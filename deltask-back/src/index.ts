// src/index.ts
import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { connectDb } from './db'

import authRoutes from './routes/authRoutes'
import workspaceRoutes from './routes/workspaceRoutes'
import boardRoutes from './routes/boardRoutes'
import columnRoutes from './routes/columnRoutes'
import cardRoutes from './routes/cardRoutes'

const app = express()
const PORT = process.env.PORT || 3000

// ─── MIDDLEWARES ────────────────────────────────────────────────────────────────
app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

// ─── ENDPOINT DE PING ────────────────────────────────────────────────────────────
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ pong: true })
})

// ─── ROUTE RACINE ────────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.send('Hello world !')
})

// ─── ROUTES D’AUTHENTIFICATION ──────────────────────────────────────────────────
app.use('/auth', authRoutes)

// ─── ROUTES WORKSPACES ───────────────────────────────────────────────────────────
app.use('/workspaces', workspaceRoutes)

// ─── ROUTES BOARDS ───────────────────────────────────────────────────────────────
// boardRoutes gère :
//   POST   /workspaces/:id/boards
//   GET    /workspaces/:id/boards
//   GET    /boards/:id
//   PUT    /boards/:id
//   DELETE /boards/:id
app.use('/', boardRoutes)

// ─── ROUTES COLONNES ─────────────────────────────────────────────────────────────
// columnRoutes gère :
//   POST   /boards/:id/columns
//   GET    /boards/:id/columns
//   PUT    /columns/:id
//   DELETE /columns/:id
app.use('/', columnRoutes)

// ─── ROUTES CARTES ──────────────────────────────────────────────────────────────
// cardRoutes gère :
//   POST   /columns/:id/cards
//   GET    /columns/:id/cards
//   PUT    /cards/:id
//   DELETE /cards/:id
app.use('/', cardRoutes)

// ─── MIDDLEWARE DE GESTION D’ERREUR ───────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ message: 'Erreur serveur', details: err.message })
})

// ─── CONNEXION À LA BASE DE DONNÉES ET LANCEMENT DU SERVEUR ──────────────────────
connectDb()
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err)
    process.exit(1)
  })
