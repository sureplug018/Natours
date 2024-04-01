const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingCotroller = require('./../controllers/bookingController');

const router = express.Router({ mergeParams: true });

router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.get('/signup', viewsController.signUp);

router.get('/sent-reset-link', viewsController.sentForgotPasswordToken);

router.get('/forgot-password', viewsController.forgotPassword);

router.get('/resetPassword/:token', viewsController.resetPassword);

router.get('/login', viewsController.login);

router.get('/confirm-account', viewsController.confirmEmail);

router.use(authController.isLoggedIn);

router.get(
  '/',
  bookingCotroller.createBookingCheckout,
  viewsController.getOverview,
);

router.get(
  '/confirmed-account/:token',
  authController.confirmEmailFE,
  viewsController.confirmedEmail,
);

router.get('/tour/:slug', viewsController.getTour);

router.get('/error', viewsController.error);

router.get('/me', viewsController.account);

module.exports = router;
