// const RatingAndReview=require("../models.RatingAndReview")
// const Course=require("../models/Course")
// const {mongoose} = require("mongoose");
// // createRating
// exports.createRating=async(req,res)=>{
//     try{
//         // fetch data
//         const userId=req.user.id;
//         const{rating,review,courseId}=req.body;
//         // chack if user is already enrolled
//         const courseDetails=await Course.findOne({
//             _id:courseId,
//             studentsEnrolled:{$eleMatch:{$eq:userId}},
//         })
//         if(!courseDetails){
//             return res.status(500).json({
//                 success:false,
//                 message:"you are not enrolled in this course"
//             })
//         }
//         // check user already reviewed
//         const alreadyReviewed=await RatingAndReview.findOne({
//             user:userId,
//             course:courseId,
//         })
        
//         if(alreadyReviewed){
//             return res.status(403).json({
//                 success:false,
//                 message:"user already reviewed"
//             })
//         }
//         // create rating review
//         const ratingReview=await RatingAndReview.create({
//             user:userId,
//             course:courseId,
//             rating,
//             review,
//         })
//         // update course with new rating
//         const updatedCourseDetails=await Course.findByIdAndUpdate(
//             {_id:courseId},
//             {
//                 $push:{
//                     RatingAndReview:ratingReview._id,
//                 }
//             },
//             {new:true}
//         )
//         console.log(updatedCourseDetails)
//         // return response
//         return res.status(200).json({
//             success:true,
//             message:"rating created"
//         })

        



//     }
//     catch(err){
//         console.log(err)
//         return res.status(500).json({
//             success:false,
//             message:"something went wrong"
//         })
//     }
// }





// // getAverageRating

// exports.getAverageRating=async(req,res)=>{
//     try{
//         // fetch data
//         const courseId=req.body.courseId;
//         // calculate average rating
//         const result=await RatingAndReview.aggregate([
//             {
//                 $match:{
//                     course:new mongoose.Type.ObjectId(courseId),
//                 }
//             },
//             {
//                 $group:{
//                     _id:null,
//                     averageRating:{$avg:"$rating"},
//                 }
//             }
//         ])
//         // return rating
        
//         // return response
//         if(result.length>0){

//             return res.status(200).json({
//                 success:true,
//                 averageRating:result[0].averageRating,
//             })
//         }
//         // if no rating is available
//         return res.status(200).json({
//             success:true,
//             averageRating:0,
//             message:"averageRating is 0,no rating available"
//         })



//     }
//     catch(err){
//         return res.status(500).json({
//             success:false,
//             message:"something went wrong"
//         })
//     }
// }



// // getAllRatingAndReview

// exports.getAllRating=async(req,res)=>{
//     try{
//         const allReviews=await RatingAndReview.find({}).sort({rating:"desc"}).populate({
//             path:"user",
//             select:"firstName lastName email image"
//         })
//         .populate({
//             path:"course",
//             select:"courseName"
//         }).exec();

//         return res.status(200).json({
//             success:true,
//             data:allReviews,
//         })



//     }
//     catch(err){
//         return res.status(500).json({
//             success:false,
//             message:"something went wrong"
//         })

//     }
// }



const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { mongo, default: mongoose } = require("mongoose");

//createRating
exports.createRating = async (req, res) => {
    try{

        //get user id
        const userId = req.user.id;
        //fetchdata from req body
        const {rating, review, courseId} = req.body;
        //check if user is enrolled or not
        const courseDetails = await Course.findOne(
                                    {_id:courseId,
                                    studentsEnrolled: {$elemMatch: {$eq: userId} },
                                });

        if(!courseDetails) {
            return res.status(404).json({
                success:false,
                message:'Student is not enrolled in the course',
            });
        }
        //check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
                                                user:userId,
                                                course:courseId,
                                            });
        if(alreadyReviewed) {
                    return res.status(403).json({
                        success:false,
                        message:'Course is already reviewed by the user',
                    });
                }
        //create rating and review
        const ratingReview = await RatingAndReview.create({
                                        rating, review, 
                                        course:courseId,
                                        user:userId,
                                    });
       
        //update course with this rating/review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
                                    {
                                        $push: {
                                            ratingAndReviews: ratingReview._id,
                                        }
                                    },
                                    {new: true});
        console.log(updatedCourseDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating and Review created Successfully",
            ratingReview,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}



//getAverageRating
exports.getAverageRating = async (req, res) => {
    try {
            //get course ID
            const courseId = req.body.courseId;
            //calculate avg rating

            const result = await RatingAndReview.aggregate([
                {
                    $match:{
                        course: new mongoose.Types.ObjectId(courseId),
                    },
                },
                {
                    $group:{
                        _id:null,
                        averageRating: { $avg: "$rating"},
                    }
                }
            ])

            //return rating
            if(result.length > 0) {

                return res.status(200).json({
                    success:true,
                    averageRating: result[0].averageRating,
                })

            }
            
            //if no rating/Review exist
            return res.status(200).json({
                success:true,
                message:'Average Rating is 0, no ratings given till now',
                averageRating:0,
            })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


//getAllRatingAndReviews

exports.getAllRating = async (req, res) => {
    try{
            const allReviews = await RatingAndReview.find({})
                                    .sort({rating: "desc"})
                                    .populate({
                                        path:"user",
                                        select:"firstName lastName email image",
                                    })
                                    .populate({
                                        path:"course",
                                        select: "courseName",
                                    })
                                    .exec();
            return res.status(200).json({
                success:true,
                message:"All reviews fetched successfully",
                data:allReviews,
            });
    }   
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    } 
}