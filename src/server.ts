import config from 'config'
import app from './app'
import connectDB from './utils/connectDB.util'

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...')
  console.log(err.name, err.message)
  process.exit(1)
})

connectDB()

const PORT = config.get<number>('PORT') || 3000
const server = app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}...`)
})

process.on('uncaughtException', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully')
  server.close(() => {
    console.log('Process terminated!')
  })
})
