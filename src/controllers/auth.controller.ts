import crypto from 'crypto'
import jwt, { JwtPayload } from 'jsonwebtoken'
import UserModel, { UserDocument } from '../models/user.model'
import catchAsync from '../utils/catchAsync.util'
import AppError from '../utils/appError.util'
import { NextFunction, Request, Response } from 'express'
import config from 'config'
import Email from '../utils/email.util'

const signToken = (id: string) => {
  return jwt.sign({ sub: id }, config.get<string>('JWT_SECRET'), {
    expiresIn: config.get<string>('JWT_EXPIRES_IN'),
  })
}

const createSendToken = (
  user: UserDocument,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(user._id)

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() +
        config.get<number>('JWT_COOKIE_EXPIRES_IN') * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-photo'] === 'https',
  })

  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  })
}

const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await UserModel.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    })

    const url = `${req.protocol}://${req.get('host')}/me`

    await new Email(newUser, url).sendWelcome()

    createSendToken(newUser, 201, req, res)
  }
)

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body

    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400))
    }

    const user = await UserModel.findOne({ email }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password!))) {
      return next(new AppError('Incorrect email or password', 401))
    }

    createSendToken(user, 200, req, res)
  }
)

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })
    res.status(200).json({ status: 'success' })
  }
)

const verifyJwt = (token: string, key: string, options = {}) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, key, options, (err, payload) => {
      if (err) {
        console.log(err)
        reject(err)
        return
      }
      resolve(payload)
    })
  })
}

const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string = ''

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      )
    }

    const decoded: JwtPayload = (await verifyJwt(
      token,
      config.get<string>('JWT_SECRET')
    )) as JwtPayload

    const currentUser = await UserModel.findById(decoded.sub)

    if (!currentUser)
      return next(
        new AppError(
          'The user belonging to this token does no longer exist',
          401
        )
      )

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      )
    }

    req.user = currentUser
    // *****
    res.locals.user = currentUser

    next()
  }
)

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  if (req.cookies.jwt) {
    try {
      const decoded: JwtPayload = (await verifyJwt(
        req.cookies.jwt,
        config.get<string>('JWT_SECRET')
      )) as JwtPayload

      const currentUser = await UserModel.findById(decoded.sub)
      if (!currentUser) return next()

      if (currentUser.changedPasswordAfter(decoded.iat)) return next()

      res.locals.user = currentUser
      return next()
    } catch (err) {
      return next()
    }
  }
  next()
}

type Roles = ('lead-guide' | 'guide' | 'admin' | 'user')[]

const restrictTo = (...roles: Roles) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      )
    }
    next()
  }
}

const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findOne({ email: req.body.email })
    if (!user)
      return next(new AppError('There is no user with email address', 404))

    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    try {
      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/resetPassword/${resetToken}`

      res.status(201).json({
        status: 'success',
        message: 'Token sent to email',
      })
    } catch (err) {
      user.passwordResetToken = undefined
      user.passwordresetExpires = undefined
      await user.save({ validateBeforeSave: false })

      return next(
        new AppError(
          'There was an error sending the email. Try again later',
          500
        )
      )
    }
  }
)

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex')

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) return next(new AppError('Token is invalid or has expired', 400))

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordresetExpires = undefined
    await user.save()

    createSendToken(user, 200, req, res)
  }
)

const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findById(req.user.id).select('+password')

    if (!user) return next(new AppError('Someting wrong happened', 500))

    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password!))
    ) {
      return next(new AppError('Your current password is wrong', 401))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    createSendToken(user, 200, req, res)
  }
)

export {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  isLoggedIn,
  logout,
}
