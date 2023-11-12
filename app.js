const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const app = express();
const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');

// setting security http headers
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'trusted-scripts.com'],
    },
  }),
);

if (process.env.NODE_ENV === 'development') {
  console.log(process.env.NODE_ENV);
}

// limiting the amount of requests from an ID
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many requests from this Ip, please try again in an hour!',
});

app.use('/api', limiter);

// limiting the amount of data that is parsed i body-parser by adding size in kb
app.use(express.json({ limit: '10kb' }));

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

app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/users', userRoutes);

// start server

module.exports = app;
