const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // step 1: create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // step 2: define the email options
  const mailOptions = {
    from: 'Eze Raphael <somraph018@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //   step 3: send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
