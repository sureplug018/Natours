const validator = require('validator');
const Review = require('./../models/reviewModel');
const Booking = require('./../models/bookingModel');

exports.getAllReviews = async (req, res) => {
  try {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter);
    // console.log(reviews);

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        review: reviews,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        review: review,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    const { tourId } = req.params;
    const review = req.body.review;
    const rating = req.body.rating;
    const tour = req.body.tour;
    const user = req.body.user;

    // Check if the user has booked the specified tour
    const booking = await Booking.findOne({ tour: tourId, user: req.user.id });

    if (!booking) {
      return res
        .status(403)
        .json({
          status: 'fail',
          message: 'You can only review tours you have booked',
        });
    }

    const sanitizedReview = review ? validator.escape(review) : undefined;
    const newReview = await Review.create({
      review: sanitizedReview,
      rating,
      tour,
      user,
    });
    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        review: review,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      message: 'successfully deleted review',
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err.message,
    });
  }
};
