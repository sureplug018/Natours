const express = require('express');
const app = express();
const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');

if (process.env.NODE_ENV === 'development') {
  console.log(process.env.NODE_ENV);
}

app.use(express.json());
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
