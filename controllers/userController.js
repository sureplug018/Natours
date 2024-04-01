const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: async (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      res.status(400).json({
        status: 'fail',
        message: 'Not an image! please upload only images.',
      }),
      false,
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};


exports.uploadUserPhoto = upload.single('photo');

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

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      user: user,
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      message: err.message,
    });
  }
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
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during account reactivation.',
    });
  }
};

exports.updateMe = async (req, res) => {
  try {
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
