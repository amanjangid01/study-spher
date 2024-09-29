const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");


//initiate the razorpay order
exports.capturePayment = async(req, res) => {

    const {courses} = req.body;
    const userId = req.user.id;

    if(courses.length === 0) {
        return res.json({success:false, message:"Please provide Course Id"});
    }

    let totalAmount = 0;

    for(const course_id of courses) {
        let course;
        try{
           
            course = await Course.findById(course_id);
            if(!course) {
                return res.status(200).json({success:false, message:"Could not find the course"});
            }

            const uid  = new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({success:false, message:"Student is already Enrolled"});
            }

            totalAmount += course.price;
        }
        catch(error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }
    const currency = "INR";
    const options = {
        amount: totalAmount * 100,
        currency,
        receipt: Math.random(Date.now()).toString(),
    }

    try{
        const paymentResponse = await instance.orders.create(options);
        res.json({
            success:true,
            message:paymentResponse,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({success:false, mesage:"Could not Initiate Order"});
    }

}


//verify the payment
exports.verifyPayment = async(req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
            return res.status(200).json({success:false, message:"Payment Failed"});
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

        if(expectedSignature === razorpay_signature) {
            //enroll karwao student ko
            await enrollStudents(courses, userId, res);
            //return res
            return res.status(200).json({success:true, message:"Payment Verified"});
        }
        return res.status(200).json({success:"false", message:"Payment Failed"});

}


const enrollStudents = async(courses, userId, res) => {
    console.log(courses, userId)
    if(!courses || !userId) {
        return res.status(400).json({success:false,message:"Please Provide data for Courses or UserId"});
    }
    
    for(const courseId of courses) {
        try{
            //find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
            {_id:courseId},
            {$push:{studentsEnrolled:userId}},
            {new:true},
        )

        if(!enrolledCourse) {
            return res.status(500).json({success:false,message:"Course not Found"});
        }

        console.log("Updated course: ", enrolledCourse)

        // const courseProgress = await CourseProgress.create({
        //     courseID: courseId,
        //     userId: userId,
        //     completedVideos: [],
        // })

        //find the student and add the course to their list of enrolledCOurses
        const enrolledStudent = await User.findByIdAndUpdate(userId,
            {$push:{
                courses: courseId,
                // courseProgress: courseProgress._id,
            }},{new:true})
            
        ///bachhe ko mail send kardo
        const emailResponse = await mailSender(
            enrollStudents.email,
            `Successfully Enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
        )
        // console.log("Email Sent Successfully", emailResponse.response);
        }
        catch(error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }

}

exports.sendPaymentSuccessEmail = async(req, res) => {
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({success:false, message:"Please provide all the fields"});
    }

    try{
        //student ko dhundo
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
             paymentSuccessEmail(`${enrolledStudent.firstName}`,
             amount/100,orderId, paymentId)
        )
    }
    catch(error) {
        console.log("error in sending mail", error)
        return res.status(500).json({success:false, message:"Could not send email"})
    }
}




// // capturea the payment and initiate the razorpay order

// exports.capturePayment = async (req,res)=>{
    
//     try{
//         // get course id nd user id

//         const{course_id}=req.body;
//         const userId=req.user.id;
//         // validate
//         // validate courseid
//         if(!course_id){
//             return res.status(400).json({
//                 success:false,
//                 message:"course id required"
//             })
//         }
        
//         // valideate course details

//         let course;
//         try{
//             course=await Course.findById(course_id);

//             if(!course) {
//                 return res.status(400).json({
//                     success:false,
//                     message:"course not found"
//                 })
//             }

//             // user already pay for same course

//             const uid=new mongoose.Types.ObjectId(userId);
//             if(course.studentsEnrolled.includes(uid)){
//                 return res.status(400).json({
//                     success:false,
//                     message:"user already enrolled"
//                 })
//             }


//         }
//         catch(err){
//             console.log(err);
//             return res.status(500).json({
//                 success:false,
//                 message:"something went wrong"
//             })

//         }
        
//         // order create
//         const amount=course.price;
//         const currency="INR";

//         const options={
//             amount:amount*100,
//             currency:currency,
//             receipt:Math.floor(Date.now()).toString(),
//             notes:{
//                 userId,
//                 courseId:course_id
//             }
            
//         }

//         try{
//             // initate the payment using razorpay
//             const paymentResponse=await instance.orders.create(options);
//             console.log(paymentResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:"order created succesfully",
//                 courseName:course.courseName,

//                 courseDescription:course.courseDescription,

//                 thumbnail:course.thumbnail,

//                 orderId:paymentResponse.id,

//                 currency:paymentResponse.currency,

//                 amount:paymentResponse.amount,

                
//             })

//         }
//         catch(err){
//             console.log(err);
//             return res.status(500).json({
//                 success:false,
//                 message:"could not create order"
//             })

//         }


//         // return response

//     }
//     catch(err){
//         console.log(err);
//         return res.status(500).json({
//             success:false,
//             message:"something went wrong",
//             error:err.message
//         })

//     }
// }


// // verify signature of response and server

// exports.verifySignature = async (req,res)=>{
//     const webhookSecret="12345678"
//     const signature=req.headers["x-razorpay-signature"];

//     const shasum=crypto.createHmac("sha256",webhookSecret);
//     shasum.update(JSON.stringify(req.body));

//     const digest=shasum.digest("hex");

//     if(signature===digest){
//         console.log("payment is authrized");

//         const {courseId,userId}=req.body.payload.entity.notes;

//         try{
//             // fulfil the action
//             // find the course and enroll iin it

//             const enrolledCourse=Course.findByCourseId(
//                 {_id:courseId},
//                 {
//                     $push:{
//                         studentsEnrolled:userId
//                     }
//                 },
//                 {new:true}

//             )
//             if(!enrolledCourse)
//             {
//                 return res.status(500).json({
//                     success:false,
//                     message:"course not found"
//                 })
//             }
//             console.log(enrolledCourse);

//             // find the student and add the course in enrolled courses

//             const enrolledStudent=await User.findOneAndUpdate(
//                 {_id:userId},
//                 {
//                     $push:{
//                         courses:courseId
//                     }
//                 },
//                 {new:true}
//             )

//             console.log(enrolledStudent)

//             // mail send of confirmation

//             const emailResponse=await mailSender(
//                 enrolledStudent.email,
//                 "course enrolled",
//                 "congratullations"
//             )
//             console.log(emailResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:"course enrolled succesfully"
//             })



//         }
//         catch(err){
//             console.log(err);
//             return res.status(500).json({
//                 success:false,
//                 message:"something went wrong"
//             })

//         }



//     }
//     else{
//         console.log("payment is not authrized");
//         return res.status(400).json({
//             success:false,
//             message:"payment is not authrized"
//         })


//     }
// }
