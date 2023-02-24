import { Router } from 'express'
import {
  forgotPassword,
  login,
  logout,
  protect,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from '../controllers/auth.controller'
import {
  createUser,
  deleteMe,
  deleteUser,
  getAllUsers,
  getMe,
  getUser,
  resizeUserPhoto,
  updateMe,
  updateUser,
  uploadUserPhoto,
} from '../controllers/user.controller'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/logout', logout)

router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

router.use(protect)

router.patch('/updateMyPassword', updatePassword)
router.get('/me', getMe, getUser)
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe)
router.delete('/deleteMe', deleteMe)

router.use(restrictTo('admin'))

router.route('/').get(getAllUsers).post(createUser)

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)

export default router
