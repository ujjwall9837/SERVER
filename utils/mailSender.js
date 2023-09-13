require("dotenv").config();
const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    let transported = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    let info = await transported.sendMail({
      from: "StudyNotion || Codehelp",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });
    console.log(info);

    return info;
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = mailSender;