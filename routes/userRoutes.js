const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const bookingRouter = require('./bookingRoutes');
const multer = require('multer');

const router = express.Router();


router.use('/:userId/bookings', bookingRouter);

const upload = multer({ dest: 'public/img/users' });

router.post('/signup', authController.signup);

router.post('/confirm-email/:token/', authController.confirmEmailBE);

router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgortPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

// Assuming '/update' is the route where user data can be updated
router.patch(
  '/update',
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  authController.updateUserData,
);

router.route('/me').get(authController.protect, userController.getUser);

router.delete('/deleteMe', authController.protect, userController.deleteMe);

router.patch('/activate', userController.activate);

// router.patch('/updateMe', upload.single('photo'), userController.updateMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
