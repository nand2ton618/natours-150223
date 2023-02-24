import catchAsync from '../utils/catchAsync.util'
import AppError from '../utils/appError.util'
import APIFeatures from '../utils/apiFeatures.util'
import { Model, PopulateOptions } from 'mongoose'
import { NextFunction, Request, Response } from 'express'

type ModelType = Model<any, {}, {}, any>

const deleteOne = (model: ModelType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await model.findByIdAndDelete(req.params.id)

    if (!doc) return next(new AppError('No document found with that ID', 404))

    res.status(204).json({ status: 'success', data: null })
  })

const updateOne = (model: ModelType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!doc) return next(new AppError('No document found with that ID', 404))

    res.status(200).json({
      status: 'success',
      data: { doc },
    })
  })

const createOne = (model: ModelType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await model.create(req.body)

    res.status(201).json({
      status: 'success',
      data: { doc },
    })
  })

const getOne = (model: ModelType, popOptions?: PopulateOptions) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query = model.findById(req.params.id)
    if (popOptions) query = query.populate(popOptions)
    const doc = await query

    if (!doc) return next(new AppError('No document found with that ID', 404))

    res.status(200).json({
      status: 'success',
      data: { doc },
    })
  })

const getAll = (model: ModelType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let filter = {}

    if (req.params.tourId) filter = { tour: req.params.tourId }

    const features = new APIFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()

    const doc = await features.query

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { doc },
    })
  })

export { deleteOne, updateOne, createOne, getOne, getAll }
