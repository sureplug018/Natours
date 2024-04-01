const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');

exports.getOverview = async (req, res) => {
  try {
    const user = res.locals.user;
    const tours = await Tour.find();
    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
      user,
      req,
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Something went wrong.',
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const user = res.locals.user;

    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    const slug = req.params.slug.toUpperCase();
    if (!tour) {
      res.status(404).render('error', {
        title: 'Error',
        user,
        message: `there is no tour with the name ${slug}`.split('-').join(' '),
      });
      return;
    }

    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour,
      user,
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Something went wrong.',
      user,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const user = res.locals.user;
    res.status(200).render('login', {
      title: 'Log in',
      user,
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message:
        'An error occcured while trying to log in! please try again later',
    });
  }
};

exports.signUp = async (req, res) => {
  try {
    const user = res.locals.user;
    res.status(200).render('signup', {
      title: 'Sign up',
      user,
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message:
        'An error occcured while trying to sign up! please try again later',
    });
  }
};

exports.confirmedEmail = async (req, res) => {
  try {
    const user = res.locals.user;
    res.status(200).render('confirmedEmail', {
      title: 'Confirmed email',
      user,
      message: 'You have successfully confirmed your email, go to login!',
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Invalid or expired verification link! Try signing up again.',
    });
  }
};

exports.confirmEmail = async (req, res) => {
  try {
    const user = res.locals.user;
    res.status(200).render('confirm-Email', {
      title: 'Confirm email',
      user,
      message:
        'Go to your mail and click the verification link to verify you account',
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'something went wrong! try again later',
    });
  }
};

exports.error = (req, res) => {
  const user = res.locals.user;
  res.status(400).render('error', {
    title: 'Error',
    user,
    message: 'something went wrong! try again later',
  });
};

exports.account = (req, res) => {
  const user = res.locals.user;
  res.status(200).render('account', {
    title: 'Your account',
    user,
  });

  if (!user) {
    return res.redirect('/login'); // Redirect to the login page
  }
};

exports.getMyTours = async (req, res) => {
  try {
    const user = res.locals.user;
    // 1 find all bookings that is related to the user id
    const bookings = await Booking.find({ user: req.user.id });

    // 2 find tours with the id of the booked tours returned for above
    const tourIds = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('overview', {
      title: 'My bookings',
      tours,
      req,
      user
    });
  } catch (err) {
    res.status(400).render('error', {
      title: 'Error',
      message: 'something went wrong! try again later',
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = res.locals.user;
    res.status(200).render('forgotPassword', {
      title: 'Forgot password',
      user,
    });
  } catch (err) {
    res.status(400).render('error', {
      title: 'Error',
      message: 'something went wrong! try again later',
    });
  }
};

exports.sentForgotPasswordToken = async (req, res) => {
  try {
    const user = res.locals.user;
    res.status(200).render('confirm-Email', {
      title: 'Sent mail',
      user,
      message: 'A password reset link have been sent to your email!',
    });
  } catch (err) {
    res.status(400).render('error', {
      title: 'Error',
      message: 'something went wrong! try again later',
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = res.locals.user;
    res.status(200).render('resetPasswordPage', {
      title: 'Reset password',
      user,
    });
  } catch (err) {
    res.status(400).render('error', {
      title: 'Error',
      message: 'something went wrong! try again later',
    });
    console.log(err);
  }
};
