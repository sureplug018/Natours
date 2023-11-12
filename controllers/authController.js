const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('./../models/userModel');
const sendEmail = require('./../utilitiles/email');

// jwt token generator
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    // Ensure that the required properties exist in req.body before accessing them
    const sanitizedName = name ? validator.escape(name) : undefined;
    const sanitizedEmail = email ? validator.escape(email) : undefined;
    const role = req.body.role;
    const sanitizedPassword = password ? validator.escape(password) : undefined;
    const sanitizedPasswordConfirm = passwordConfirm
      ? validator.escape(passwordConfirm)
      : undefined;

    // Create a new user with the sanitized values
    const newUser = await User.create({
      name,
      email,
      role,
      password,
      passwordConfirm,
    });

    // generating token for signup
    const token = signToken(newUser._id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      secure: true,
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    res.status(201).json({
      status: 'success',
      token: token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    // get the details entered

    const { email, password } = req.body;

    const sanitizedEmail = email ? validator.escape(email) : undefined;
    const sanitizedPassword = password ? validator.escape(password) : undefined;

    // check if they entered anything
    if (!sanitizedEmail || !sanitizedPassword) {
      res.status(401).json({
        status: 'fail',
        message: 'Please provide email and password!',
      });
      return;
    }

    // fetching data from database
    const user = await User.findOne({ email: sanitizedEmail }).select(
      '+password',
    );

    // comparing the input data and the saved data
    if (
      !user ||
      !(await user.correctPassword(sanitizedPassword, user.password))
    ) {
      res.status(401).json({
        status: 'fail',
        message: 'incorrect password or email',
      });
      return;
    }

    // generating token for login
    const token = signToken(user._id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      secure: true,
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    // sending response777
    res.status(200).json({
      status: 'success',
      token: token,
    });
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;

    // step 1: get the jwt tken and check if its true
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        status: 'fail',
        message: 'you are not logged in, please login to get access',
      });
      return;
    }

    // step 2: verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // step 3: check if user still exists
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      res.status(401).json({
        status: 'fail',
        message: 'the user belonging to this token does no longer exists',
      });
      return;
    }

    // step 4: check if the user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
      res.status(401).json({
        status: 'fail',
        message: 'user recently changed password! please login again',
      });
      return;
    }

    // step 5: grant access to protected route
    req.user = freshUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'fail',
        message: 'you do not have the permission to perform this action',
      });
      return;
    }
    next();
  };
};

exports.forgortPassword = async (req, res, next) => {
  // step 1: get user based on posted email
  try {
    const email = req.body.email;

    const sanitizedEmail = email ? validator.escape(email) : undefined;
    const user = await User.findOne({ email: sanitizedEmail });

    // step 2: check if the user exists
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'there is no user with email address',
      });
      return;
    }

    // step 3: generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH with your new password and passwordConfirm to: ${resetUrl}.\n if you didn't forget your password, please ignore this email`;

    // step 5: sending the email
    try {
      await sendEmail({
        email: user.email,
        subject: 'your password reset token (valid for 10 mins)',
        message: message,
      });
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      (user.passwordResetToken = undefined),
        (user.passwordResetExpires = undefined),
        await user.save({ validateBeforeSave: false });

      return next(
        res.status(500).json({
          status: 'fail',
          message: 'there was an error sending the email, try again',
        }),
      );
    }
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  // step 1: get user based on the token
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // step 2: if the token has not expired and there is user set the new password
    if (!user) {
      res
        .status(400)
        .json({ status: 'fail', message: 'Token is invalid or has expired' });
      return;
    }

    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    const sanitisedPassword = password ? validator.escape(password) : undefined;
    const sanitizedPasswordConfirm = passwordConfirm
      ? validator.escape(passwordConfirm)
      : undefined;

    user.password = sanitisedPassword;
    user.passwordConfirm = sanitizedPasswordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // step 3: generate JWT and login the user
    const token = signToken(user._id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      secure: true,
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      token: token,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  // step 1: get user from the collection
  try {
    const user = await User.findById(req.user.id).select('+password');

    // step 2: check if posted password is correct

    const passwordCurrent = req.body.passwordCurrent;

    const sanitizedPasswordCurrent = passwordCurrent
      ? validator.escape(passwordCurrent)
      : undefined;
    if (
      !(await user.correctPassword(sanitizedPasswordCurrent, user.password))
    ) {
      res.status(401).json({
        status: 'fail',
        maessage: 'Your current password is wrong',
      });
      return;
    }

    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    const sanitizedPassword = password ? validator.escape(password) : undefined;
    const sanitizedPasswordConfirm = passwordConfirm
      ? validator.escape(passwordConfirm)
      : undefined;

    // step 3: if it is correct, update password
    user.password = sanitizedPassword;
    user.passwordConfirm = sanitizedPasswordConfirm;
    await user.save();

    // step 4: send JWT and login the user
    const token = signToken(user._id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      secure: true,
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      token: token,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
