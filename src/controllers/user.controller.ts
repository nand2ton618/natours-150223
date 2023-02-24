import { NextFunction, Request, Response } from 'express'
import catchAsync from '../utils/catchAsync.util'
import AppError from '../utils/appError.util'
import UserModel from '../models/user.model'
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory.controller'
import multer, { FileFilterCallback } from 'multer'
import sharp from 'sharp'

const multerStorage = multer.memoryStorage()

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith('image')) cb(null, true)
  else cb(new AppError('Not an image! Please upload only images.', 400))
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
})

const uploadUserPhoto = upload.single('photo')

const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next()

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`)

    next()
  }
)

const filterObj = (obj: Record<string, string>, ...allowedFields: string[]) => {
  const newObj: Record<string, string> = {}
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id
  next()
}

const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.password || req.body.passwordConfirm)
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword',
          400
        )
      )

    const filteredBody = filterObj(req.body, 'name', 'email')
    if (req.file) filteredBody.photo = req.file.filename

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    )

    res.status(200).json({
      status: 'success',
      data: { user: updatedUser },
    })
  }
)

const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await UserModel.findByIdAndDelete(req.user.id, { active: false })

    res.status(204).json({
      status: 'success',
      data: null,
    })
  }
)

const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  })
}

const getAllUsers = getAll(UserModel)
const getUser = getOne(UserModel)
const updateUser = updateOne(UserModel)
const deleteUser = deleteOne(UserModel)

export {
  getAllUsers,
  updateMe,
  deleteMe,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  resizeUserPhoto,
  uploadUserPhoto,
}
