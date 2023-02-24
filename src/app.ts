import express from 'express'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import hpp from 'hpp'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import errorController from './controllers/error.controller'
import { UserDocument } from './models/user.model'
import tourRouter from './routes/tour.route'
import userRouter from './routes/user.route'
import bookingRouter from './routes/booking.route'
import reviewRouter from './routes/review.route'
import viewRouter from './routes/view.route'
import AppError from './utils/appError.util'
import path from 'path'
import compression from 'compression'

declare global {
  namespace Express {
    interface Request {
      requestTime: string
      user: UserDocument
    }
  }
}

const app = express()

app.enable('trust proxy')

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.use(cors())

app.options('*', cors())

app.use(express.static(path.join(__dirname, 'public')))

app.use(helmet())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
})
app.use('/api', limiter)

// app.post('/webhook-checkout', express.raw({ type: 'application/json' }), webhookCheckout)

app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

app.use(mongoSanitize())

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsquantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
)

app.use(compression())

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  next()
})

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(errorController)

export default app
