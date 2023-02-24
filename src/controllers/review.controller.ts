import { NextFunction, Request, Response } from 'express'
import ReviewModel from '../models/review.model'
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory.controller'

const setTourUserIds = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user.id
  next()
}

const getAllReviews = getAll(ReviewModel)
const getReview = getOne(ReviewModel)
const createReview = createOne(ReviewModel)
const updateReview = updateOne(ReviewModel)
const deleteReview = deleteOne(ReviewModel)

export {
  setTourUserIds,
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
}
