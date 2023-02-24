import { NextFunction, Request, Response } from 'express'
import BookingModel from '../models/booking.model'
import TourModel from '../models/tour.model'
import UserModel from '../models/user.model'
import AppError from '../utils/appError.util'
import catchAsync from '../utils/catchAsync.util'

const alerts = (req: Request, res: Response, next: NextFunction) => {
  const { alert } = req.query
  if (alert === 'booking')
    res.locals.alert =
      'Your booking was successful! Please check your email for a confirmation'
  next()
}

const getOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tours = await TourModel.find()

    res.status(200).render('overview', { title: 'All Tours', tours })
  }
)

const getTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tour = await TourModel.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    })

    if (!tour)
      return next(new AppError('There is no tour with that name.', 404))

    res.status(200).render('tour', { title: `${tour.name} Tour`, tour })
  }
)

const getLoginForm = (req: Request, res: Response) => {
  res.status(200).render('login', { title: 'Log into your account' })
}

const getAccount = (req: Request, res: Response) => {
  res.status(200).render('account', { title: 'Your account' })
}

const getMytours = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await BookingModel.find({ user: req.user.id })

    const tourIds = bookings.map((el) => el.tour)
    const tours = await TourModel.find({ _id: { $in: tourIds } })

    res.status(200).render('overview', { title: 'My tours', tours })
  }
)

const updateUserData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      { name: req.body.name, email: req.body.email },
      { new: true, runValidators: true }
    )

    res
      .status(200)
      .render('account', { title: 'Your account', user: updatedUser })
  }
)

export {
  getAccount,
  getLoginForm,
  getMytours,
  getOverview,
  getTour,
  updateUserData,
  alerts,
}
