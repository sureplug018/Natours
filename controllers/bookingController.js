const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');

exports.getCheckoutSession = async (req, res) => {
  try {
    // 1 get currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2 create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${
        req.params.tourId
      }&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
          },
          quantity: 1,
        },
      ],
    });

    // 3 create a checkout response
    res.status(200).json({
      status: 'success',
      session,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.createBookingCheckout = async (req, res, next) => {
  try {
    // this is temporary because it is unsecure
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();

    // Fetch the tour details from the database
    const tourDetails = await Tour.findById(tour);

    // check if the maxGroupSize limit is reached
    // no need for this error handling because the button have will disabled in the front end if limit is reached
    // if (tourDetails.bookings >= tourDetails.maxGroupSize) {
    //   res.status(400).json({
    //     status: 'fail',
    //     message:
    //       'the limit of group max group size of this tour have been reached',
    //   });
    //   return;
    // }

    if (tourDetails.bookings < tourDetails.maxGroupSize) {
      await Booking.create({ tour, user, price });

      // Update the tour's bookings count
      await Tour.findByIdAndUpdate(tour, { $inc: { bookings: 1 } });
    }

    res.redirect(req.originalUrl.split('?')[0]);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { tour, user, price } = req.body;

    // Fetch the tour details from the database
    const tourDetails = await Tour.findById(tour);

    // check if the maxGroupSize limit is reached
    if ((tourDetails.bookings >= tourDetails.maxGroupSize)) {
      res.status(400).json({
        status: 'fail',
        message:
          'the limit of group max group size of this tour have been reached',
      });
      return;
    }

    if (tourDetails.bookings < tourDetails.maxGroupSize) {
      const booking = await Booking.create({ tour, user, price });

      // Update the tour's bookings count
      await Tour.findByIdAndUpdate(tour, { $inc: { bookings: 1 } });

      res.status(201).json({
        status: 'success',
        data: {
          booking,
        },
      });
    }
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    let filter = {};

    if (req.params.tourId) filter = { tour: req.params.tourId };
    if (req.params.userId) filter = { user: req.params.userId };
    const bookings = await Booking.find(filter);

    res.status(200).json({
      status: 'success',
      result: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      message: 'successfully deleted booking',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
