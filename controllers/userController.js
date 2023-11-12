const User = require('./../models/userModel');

// Define user-related controller functions within this file
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users: users,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      message: 'this route is not yet defined',
    });
  }
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'failed',
    message: 'this route is not yet defined',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'failed',
    message: 'this route is not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'failed',
    message: 'this route is not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'failed',
    message: 'this route is not yet defined',
  });
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.activate = async (req, res, next) => {
  try {
    const filter = { email: req.body.email, active: false };
    const update = { $set: { active: true } };

    const result = await User.updateOne(filter, update);

    if (result.n === 0) {
      // No document matched the filter criteria
      return res.status(404).json({
        status: 'fail',
        message: 'User not found or already activated.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Your account has been successfully reactivated.',
      },
    });
  } catch (err) {
    console.error('Error during account reactivation:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during account reactivation.',
    });
  }
};
