import express, { Router } from 'express'
import { protect, restrictTo } from '../controllers/auth.controller'
import {
  createBooking,
  deleteBooking,
  getAllBooking,
  getBooking,
  updateBooking,
} from '../controllers/booking.controller'

const router = Router()

router.use(protect)

// router.get('/checkout-session/:tourId', getCheckoutSession)

router.use(restrictTo('admin', 'lead-guide'))

router.route('/').get(getAllBooking).post(createBooking)

router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking)

export default router
