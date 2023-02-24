import { Router } from 'express'
import { isLoggedIn, protect } from '../controllers/auth.controller'
import {
  getAccount,
  getLoginForm,
  getMytours,
  getOverview,
  getTour,
  updateUserData,
} from '../controllers/view.controller'

const router = Router()

router.get('/', isLoggedIn, getOverview)
router.get('/tour/:slug', isLoggedIn, getTour)
router.get('/login', isLoggedIn, getLoginForm)
router.get('/me', protect, getAccount)

router.get('/my-tours', protect, getMytours)

router.post('/submit-user-data', protect, updateUserData)

export default router
