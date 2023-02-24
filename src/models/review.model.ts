import { Document, model, ObjectId, Schema } from 'mongoose'
import TourModel from './tour.model'

export interface ReviewDocument extends Document {
  review: string
  rating: number
  tour: ObjectId
  user: ObjectId
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema(
  {
    review: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' })
  next()
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ])

  if (stats.length > 0) {
    await TourModel.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    })
  } else {
    await TourModel.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    })
  }
}

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour)
})

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne()
  next()
})

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour)
})

const ReviewModel = model<ReviewDocument>('Review', reviewSchema)

export default ReviewModel
