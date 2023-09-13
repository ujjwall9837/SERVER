const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();
exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization".replace("Bearer ", ""));

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Token missing",
      });
    }
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (err) {
        console.log(err);
      return res.status(401).json({
        success: false,
        message: "token is invalid",
      });
    }

    next();
  } catch (error) {
    // console.log(error);
    return res.status(401).json({
      success: false,
      message: "Error in middleware of auth while validating token",
    });
  }
};

exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "This is a protected routes for student",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role not verified",
    });
  }
};
exports.isInstructor = async (req, res, next) => {
  try {
    console.log(req.user.accountType);
    if (req.user.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is a protected routes for Instructor",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role not verified",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is a protected routes for Admin",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role not verified",
    });
  }
};
