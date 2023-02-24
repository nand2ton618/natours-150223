import { Document, model, Schema } from 'mongoose'

export interface BookingDocument extends Document {
  tour: Schema.Types.ObjectId
  user: Schema.Types.ObjectId
  price: number
  createdAt: Date
  updatedAt: Date
}

const bookingSchema = new Schema(
  {
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
)

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  })
  next()
})

const BookingModel = model<BookingDocument>('Booking', bookingSchema)

export default BookingModel
