const mongoose = require('mongoose');
const validator = require('validator');
const path = require('path');
const passport = require('passport');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a user must have a name'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: 'Invalid email address',
    },
  },
  photo: String,
  password: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (value) {
        return value.length >= 8;
      },
      message: 'Password must be up to 8 characters',
    },
  },
  passwordConfirm: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        return value.this === password;
      },
      message: 'Passwords does not match',
    },
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User