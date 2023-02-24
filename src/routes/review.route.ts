import { Router } from 'express'
import { protect, restrictTo } from '../controllers/auth.controller'
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReview,
  setTourUserIds,
  updateReview,
} from '../controllers/review.controller'

const router = Router()

router.use(protect)

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview)

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview)

export default router
