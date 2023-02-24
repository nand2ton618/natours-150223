import { NextFunction, Request, Response } from 'express'
import sharp from 'sharp'
import multer, { FileFilterCallback } from 'multer'
import AppError from '../utils/appError.util'
import catchAsync from '../utils/catchAsync.util'
import TourModel from '../models/tour.model'
import {
  getAll,
  getOne,
  createOne,
  deleteOne,
  updateOne,
} from './handlerFactory.controller'

const multerStorage = multer.memoryStorage()

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400))
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
})

const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
])

const resizeTourImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files.imageCover || !req.files.images) return next()

    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`)

    req.body.images = []
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`)

        req.body.images.push(filename)
      })
    )

    next()
  }
)

const aliasTopTours = (req: Request, res: Response, next: NextFunction) => {
  req.query.limit = '5'
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
  next()
}

const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await TourModel.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$Price' },
        },
      },
      { $sort: { avgPrice: 1 } },
    ])

    res.status(200).json({
      status: 'success',
      data: { stats },
    })
  }
)

const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const year = Number(req.params.year)
    const plan = await TourModel.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      { $addFields: { month: '$_id' } },
      { $project: { _id: 0 } },
      { $sort: { numTourStarts: -1 } },
      { $limit: 12 },
    ])

    res.status(200).json({
      status: 'success',
      data: { plan },
    })
  }
)

const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { distance, latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

    if (!lat || !lng)
      return next(
        new AppError(
          'Please provide latitude and longtitude in the format lat,lng',
          400
        )
      )

    const tours = await TourModel.find({
      startLocation: { $geoWithing: { $centerSphere: [[lng, lat], radius] } },
    })

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    })
  }
)

const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001

    if (!lat || !lng)
      return next(
        new AppError(
          'Please provide latitude and longtitude in the format lat,lng',
          400
        )
      )

    const distances = await TourModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [+lng, +lat] },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      { $project: { distance: 1, name: 1 } },
    ])

    res.status(200).json({
      status: 'success',
      data: { distances },
    })
  }
)

const getAllTours = getAll(TourModel)
const getTour = getOne(TourModel, { path: 'reviews' })
const createTour = createOne(TourModel)
const updateTour = updateOne(TourModel)
const deleteTour = deleteOne(TourModel)

export {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getMonthlyPlan,
  getTourStats,
  aliasTopTours,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
}
