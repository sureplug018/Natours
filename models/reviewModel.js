const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true }, // Include virtuals when document is converted to JSON
    toObject: { virtuals: true }, // Include virtuals when document is converted to an object
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// preventing duplicate reviews on a particular tour from on same user
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'tour',
//     select: 'name',
//   });
//   next();
// });

// this is a aggregatetion pipeline that calculates the ratings average and the rating quantity
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
  ]);
  // setting the values of the ratingsQuantity and the ratingsAverage
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // this is 4.5 because the default is 4.5 if there is no review
    });
  }
};

// this is the code that runs executes the aggregation pipeline, and this runs after saving a review
reviewSchema.post('save', function () {
  // this points to the current review document
  this.constructor.calcAverageRatings(this.tour);
});

// updating ratingsAverage and ratingsQunatity when they are deleted or updated
// this code will find the review before deleting or updating it
reviewSchema.pre(/^findOneAnd/, async function (next) {
  console.log(this.r);
  //   // we are using findOneAnd regular expression because update and delete are being done by findOneAndUpdate and finfOneAndDelete
  this.r = await this.findOne(); // we are using this.r for we to be able to make use of the await in another middleware
  next();
});

// this code awaits the first one to find and then runs the calculation of raingsAverage and ratingsQuantity
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
