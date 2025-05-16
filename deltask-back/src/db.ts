import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/deltask'

export function connectDb() {
  return mongoose
    .connect(uri)
    .then(() => console.log('✔️  MongoDB connecté'))
    .catch(err => {
      console.error('❌  Erreur connexion MongoDB', err)
      process.exit(1)
    })
}
