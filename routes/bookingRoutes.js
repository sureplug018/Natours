const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .delete(bookingController.deleteBooking)
  .patch(bookingController.updateBooking);

module.exports = router;
