const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");
const { error } = require("console");
exports.resetPasswordToken = async (req, res) => {
  try {
    const  email  = req.body.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({
        success: false,
        message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
      });
    }
    const token = crypto.randomUUID();
    const updatedDetails = await User.findOneAndUpdate(
      { email },
      {
        token: token,
        resetPasswordToken: Date.now() + 5 * 60 * 1000,
      },
      //give new document in updated DEtails
      { new: true }
    );

    const url = `http://localhost:3000/update-password/${token}`;
    await mailSender(
      email,
      "Password Reset Link",
      `Password reset link : ${url}`
    );
    return res.status(200).json({
      success: true,
      message: "Mail sent successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error while reseting password",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password not Matching",
      });
    }
    const userDetails = await User.findOne({ token: token });
    if (!userDetails) {
      return res.json({
        success: false,
        message: "User not existed",
      });
    }
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "Link expired",
      });
    }
    let hashedPassword = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { token: token },
      {
        password: hashedPassword,
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Password reset succefully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in reset",
    });
  }
};
