const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });
const app = require('./app');

// this is where we connected database to our app
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('successfully connected to database');
  })
  .catch((err) => {
    console.log(err);
  });


const port = 3000;
app.listen(port, () => {
  console.log(`app is listening on port ${port}`);
});
