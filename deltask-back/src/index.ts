// src/index.ts
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/authRoutes'


// Si tu as créé d’autres routes, pense à ajouter aussi .ts :
// import userRoutes from './routes/userRoutes.ts'
// import pingRoutes from './routes/pingRoutes.ts'

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

// ─── MIDDLEWARE DE GESTION D’ERREUR ───────────────────────────────────────────────
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur', details: err.message })
  }
)

// ─── LANCEMENT DU SERVEUR ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
