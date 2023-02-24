import fs from 'fs'
import path from 'path'
import TourModel from '../../models/tour.model'

import connectDB from '../../utils/connectDB.util'

connectDB()

const tours = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tours.json')).toString()
)

const importData = async () => {
  try {
    await TourModel.create(tours)
    console.log('Data successfully loaded')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

const deleteData = async () => {
  try {
    await TourModel.deleteMany()
    console.log('Data successfully deleted')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

if (process.argv[2] === '--import') {
  importData()
} else if (process.argv[2] === '--delete') {
  deleteData()
}
