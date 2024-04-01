const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('./../models/userModel');
const Email = require('./../utilitiles/email');

// jwt token generator
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    // Check if user with the given email and unconfirmed status exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Check if the existing user is unconfirmed, then delete
      if (existingUser.confirmed === false) {
        await User.findByIdAndDelete(existingUser._id);
      } else {
        return res.status(400).json({
          status: 'fail',
          message: 'User with this email already exists',
        });
      }
    }

    // Create a new user
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });

    // Set confirmationToken and confirmationTokenExpires after user creation
    newUser.confirmationToken = crypto.randomBytes(32).toString('hex');
    newUser.confirmationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save the user with the updated confirmation fields
    await newUser.save();

    const url = `${req.protocol}://${req.get('host')}/confirmed-account/${
      newUser.confirmationToken
    }`;
    await new Email(newUser, url).sendConfirmEmail();

    // generating token for signup
    // const token = signToken(newUser._id);

    // const cookieOptions = {
    //   expires: new Date(
    //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    //   ),
    //   secure: true,
    //   httpOnly: true,
    // };

    // if (process.env.NODE_ENV === 'production') {
    //   cookieOptions.secure = true;
    // }

    // res.cookie('jwt', token, cookieOptions);

    res.status(201).json({
      status: 'success',
      // token: token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    return res.status(404).json({
      status: 'fail',
      message: err.message.split(': ')[2],
    });
  }
};
exports.confirmEmailFE = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find the user by the confirmation token
    const user = await User.findOne({ confirmationToken: token });

    // check if the token exists
    if (!user || user.confirmationTokenExpires < Date.now()) {
      return res.status(500).render('error', {
        title: 'Error',
        user,
        message: 'Invalid or expired verification link! try signing up again',
      });
    }

    // else Update the user's status to confirmed
    user.confirmed = true;
    user.confirmationToken = undefined;
    user.confirmationTokenExpires = undefined;
    await user.save();

    // Send welcome email
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(user, url).sendWelcome();
    next();
  } catch (err) {
    return res.status(500).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.confirmEmailBE = async (req, res) => {
  try {
    const { token } = req.params;

    // Find the user by the confirmation token
    const user = await User.findOne({ confirmationToken: token });

    // check if the token exists
    if (!user || user.confirmationTokenExpires < Date.now()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired confirmation token.',
      });
    }

    // else Update the user's status to confirmed
    user.confirmed = true;
    user.confirmationToken = undefined;
    user.confirmationTokenExpires = undefined;
    await user.save();

    // Send welcome email
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(user, url).sendWelcome();

    // Redirect or respond with a success message
    res.status(200).json({
      status: 'success',
      message: 'Email confirmed successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    // get the details entered

    const { email, password } = req.body;

    const sanitizedEmail = email ? validator.escape(email) : undefined;
    // const sanitizedPassword = password ? validator.escape(password) : undefined;

    // check if they entered anything
    if (!sanitizedEmail || !password) {
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
    if (!user) {
      res.status(401).json({
        status: 'fail',
        message: 'incorrect password or email',
      });
      return;
    }

    if (user.confirmed === false) {
      return res.status(403).json({
        status: 'fail',
        message:
          'Go to your mail and click the confirmation link to confirm your email before login',
      });
    }

    // comparing the input data and the saved data
    if (!(await user.correctPassword(password, user.password))) {
      res.status(401).json({
        status: 'fail',
        message: 'incorrect password or email',
      });
      return;
    }

    // generating token for login
    const token = signToken(user._id);

    const cookieOptions = {
      expiresIn: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      secure: false,
      httpOnly: false,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.httpOnly = true;
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
    // if (
    //   req.headers.authorization &&
    //   req.headers.authorization.startsWith('Bearer')
    // ) {
    //   token = req.headers.authorization.split(' ')[1];
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // if (!token) {
    //   res.status(401).json({
    //     status: 'fail',
    //     message: 'you are not logged in, please login to get access',
    //   });
    //   return;
    // }

    if(!token) {
      return res.redirect('/login'); // Redirect to the login page
    }

    // step 2: verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // step 3: check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      res.status(401).json({
        status: 'fail',
        message: 'the user belonging to this token does no longer exists',
      });
      return;
    }

    // step 4: check if the user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      res.status(401).json({
        status: 'fail',
        message: 'user recently changed password! please login again',
      });
      return;
    }

    // step 5: grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
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
        message: 'There is no user with email address',
      });
      return;
    }

    // step 3: generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // step 5: sending the email
    try {
      const resetUrl = `${req.protocol}://${req.get(
        'host',
      )}/resetPassword/${resetToken}`;

      await new Email(user, resetUrl).sendPasswordReset();

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
      secure: false,
      httpOnly: false,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.httpOnly = true;
    }

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      token: token,
    });
    next();
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    const passwordCurrent = req.body.passwordCurrent;
    // const sanitizedPasswordCurrent = passwordCurrent
    //   ? validator.escape(passwordCurrent)
    //   : undefined;

    // The rest of your code for password validation...

    // comparing the input data and the saved data
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      res.status(401).json({
        status: 'fail',
        message: 'your current password is wrong.',
      });
      return;
    }

    // Check if the request body contains password and passwordConfirm
    if (!req.body.password || !req.body.passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password and password confirmation are required',
      });
    }

    if (req.body.password !== req.body.passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message: 'newpassword and passwod confirm does not match',
      });
    }

    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    // const sanitizedPassword = validator.escape(password);
    // const sanitizedPasswordConfirm = validator.escape(passwordConfirm);

    // Update user password and passwordConfirm
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    // Generate a new JWT token
    const token = signToken(user._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      secure: false,
      httpOnly: false,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.httpOnly = true;
    }

    // Set JWT token in cookie and send response
    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      token: token,
    });
  } catch (err) {
    // Handle specific error types
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.',
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }
  }
};

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // step 2: verification of token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // step 3: check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // step 4: check if the user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // step 5: grant access to protected route
      res.locals.user = currentUser;
      return next();
    }
    next();
  } catch (err) {
    return next();
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

// Function to update user data
exports.updateUserData = async (req, res) => {
  try {
    // Step 1: Authentication - Verify JWT token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt, // Assuming the JWT is stored in a cookie
      process.env.JWT_SECRET,
    );

    // Step 2: Fetch the user from the database
    const currentUser = await User.findById(decoded.id);

    const { name, email } = req.body;

    const sanitizedName = name ? validator.escape(name) : undefined;
    const sanitizedEmail = email ? validator.escape(email) : undefined;

    // Step 3: Update user data based on the request body
    if (req.body.name) {
      currentUser.name = sanitizedName;
    }

    if (req.body.email) {
      currentUser.email = sanitizedEmail;
    }

    if (req.file) {
      currentUser.photo = req.file.filename;
    }

    // Step 4: Save the updated user data
    await currentUser.save();

    // Step 5: Respond with success message and updated user data
    res.status(200).json({
      status: 'success',
      data: {
        user: currentUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
