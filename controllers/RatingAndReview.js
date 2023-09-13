const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");
// create reating

exports.createRating = async (req, res) => {
  try {
    //get user
    const userId = req.body.id;
    //fetch data from req
    const { rating, review, courseId } = req.body;
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $eleMatch: { $eq: userId } },
    });

    // check user  enrolled or not
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student not enroleed in this course",
      });
    }
    // check if already reviewd the course
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });
    if (alreadyReviewed) {
      return res
        .status(403)
        .json({ message: "Course already reviewed", success: false });
    }
    // create review
    const ratingReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });
    // update course with the review
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          ratingAndReviews: ratingReview._id,
        },
      },
      { new: true }
    );
    console.log(updatedCourseDetails);
    // return response
    return res.status(200).json({
      success: true,
      message: "Rating added Succesffuly",
      ratingReview,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//getaverage rating

exports.getAverageRating = async (req, res) => {
  try {
    const courseId = req.body.courseId;
    // calculate average rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);
    if (result.length > 0) {
      return res
        .status(200)
        .json({ success: true, averageRating: result[0].averageRating });
    }
    return res.status(200).json({
      success: true,
      averageRating: 0,
      message: "Average rating 0 no rating till now",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// get all rating
exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({ path: "user", select: "firstName lastName email image" })
      .populate({ path: "course", select: "courseName" })
      .exec();
    return res.status(200).json({
      success: true,
      message: "All reviews fetched succefully",
      data: allReviews,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
