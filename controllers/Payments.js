const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");

//capture the payment
exports.capturePayment = async (req, res) => {
  const { course_Id } = req.body;
  const userId = req.user.id;
  if (!course_Id) {
    return req.json({
      success: false,
      message: "Please provide course id",
    });
  }
  let course;
  try {
    course = await Course.findById(course_Id);
    if (!course) {
      if (!course) {
        return req.json({
          success: false,
          message: "Couldnt find the valid course",
        });
      }
    }
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(uid)) {
      return res.status(400).json({
        success: false,
        message: "Student is  already enrolled",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  const amount = course.price;
  const currency = "INR";
  const options = {
    amount: amount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
    notes: {
      courseId: course_Id,
      userId,
    },
  };
  try {
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    return res.status(200).json({
      success: true,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      amount: paymentResponse.amount,
      currency: paymentResponse.currency,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Could not initiate order",
    });
  }
};

// authorization of the payment
exports.verifySignature = async (req, res) => {
  //server entered by us
  const webhookSecret = "12345678";
  // received by razorpay fixed syntax
  //its hashed data
  // we have to decrypt
  // produced by
  const signature = req.headers("x-razorpay-signature");
  //   hasing message authentication code
  //   SHA hasing algorith
  // HMAC using technique + secret key
  //output of  SHA is know as digest

  const shasum = crypto.createHmac("sha256", webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");
  if (signature === digest) {
    console.log("Payment is authorized");

    const { userId, courseId } = req.body.payload.payment.entity.notes;
    try {
      // add student in course
      const enrolledCourse = await Course.findByIdAndUpdate(
        { _id: courseId },
        {
          $push: { studentsEnrolled: userId },
        },
        { new: true }
      );
      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, message: "Course not found" });
      }
      console.log(enrolledCourse);
      // adc course in student directory
      const enrolledStudent = await User.findByIdAndUpdate(
        { _id: userId },
        { $push: { courses: courseId } },
        { new: true }
      );
      console.log(enrolledStudent);
      // mail send krna hai ab usin mail sender tempplate
      const emailResponse = await mailSender(
        enrolledStudent.email,
        "Congratulation from codehelp",
        "You are onboarded to new course"
        // courseEnrollmentEmail(enrolledCourse, enrolledStudent.name),
      );
      console.log(emailResponse);
      return res.status(200).json({
        succcess: true,
        message: "Signature verified",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }
};
