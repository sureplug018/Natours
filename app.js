const express = require('express');
const helmet = require('helmet');
const path = require('path');
const hpp = require('hpp');
const ejs = require('ejs');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const tourRoutes = require('./routes/tourRoutes');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const viewsRoutes = require('./routes/viewsRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
 
const app = express();
app.set('view engine', 'ejs');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://js.stripe.com/'],
      scriptSrc: [
        "'self'",
        "'nonce-randomnoncevaluehere'",
        'https://cdnjs.cloudflare.com',
        'https://unpkg.com',
        'https://js.stripe.com/v3/',
      ],
      imgSrc: [
        "'self'",
        'https://unpkg.com',
        'data:',
        'https://a.basemaps.cartocdn.com',
        'https://b.basemaps.cartocdn.com',
        'https://c.basemaps.cartocdn.com',
      ],
    },
  }),
);

if (process.env.NODE_ENV === 'development') {
  console.log(process.env.NODE_ENV);
}
app.set('views', path.join(__dirname, 'views'));

// limiting the amount of requests from an IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many requests from this Ip, please try again in an hour!',
});

app.use('/api', limiter);

// limiting the amount of data that is parsed in body-parser by adding size in kb
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// DATA SANITIZATION
app.use(mongoSanitize());

// cleaning any user input that contains any malicious html or javascript code
// this is done using validator.escape to validate before any input

// prevening parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'difficulty',
      'maxGroupSize',
      'ratingsQuantity',
      'price',
    ],
  }),
);

app.use(express.static('./public'));

/*app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello from the server!', app: 'Raphael' });
});
*/

// routes

app.use('/', viewsRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/booking', bookingRoutes);

// start server

module.exports = app;
