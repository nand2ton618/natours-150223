import mongoose from 'mongoose'
import config from 'config'

async function connectDB() {
  const dbUri = config.get<string>('DATABASE')

  try {
    await mongoose
      .set('strictQuery', false)
      .connect(dbUri)
      .then(() => console.log('DB connection successful!'))
  } catch (err) {
    console.log('### Could not connect to DB')
    process.exit(1)
  }
}

export default connectDB
