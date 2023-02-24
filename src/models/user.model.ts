import crypto from 'crypto'
import { Document, model, Schema } from 'mongoose'
import bcrypt from 'bcrypt'

export interface UserDocument extends Document {
  name: string
  email: string
  photo?: string
  role: 'user' | 'guide' | 'lead-guide' | 'admin'
  password?: string
  passwordConfirm?: string
  passwordChangedAt?: Date
  passwordResetToken?: string
  passwordresetExpires?: Date
  active: boolean
  createdAt: Date
  updatedAt: Date
  correctPassword: (
    candidatePassword: string,
    hashedPassword: string
  ) => boolean
  changedPasswordAfter: (JWTTimestamp: number | undefined) => boolean
  createPasswordResetToken: () => string
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    photo: String,
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: { type: String, required: true },
    passwordConfirm: { type: String, required: true },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: { type: Boolean, default: true, select: false },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  // @ts-ignore
  this.passwordConfirm = undefined
  next()
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()
  this.passwordChangedAt = new Date(Date.now() - 1000)
  next()
})

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } })
  next()
})

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, hashedPassword)
}

userSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number
): boolean {
  // if (!JWTTimestamp) return false

  const user = this as UserDocument
  if (user.passwordChangedAt) {
    const changedTimestamp = user.passwordChangedAt.getTime() / 1000
    return JWTTimestamp < changedTimestamp
  }
  return false
}

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')
  const user = this as UserDocument

  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  user.passwordresetExpires = new Date(Date.now() + 10 * 60 * 1000)

  return resetToken
}

const UserModel = model<UserDocument>('User', userSchema)

export default UserModel
