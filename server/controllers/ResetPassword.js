const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const bcrypt=require("bcrypt")

// reset password token
exports.resetPasswordToken=async(req,res)=>{
    try{
        // get email from req body
        const email=req.body.email;

        // check user for email
        const user=await User.findOne({email: email});
        if(!user){
            return res.status(404).json({
                message:"your email is not registerd with us"
            })
        }
        // link generate
        // token generate
        const token=crypto.randomUUID()
        // udate user by adding token and expiration time 
        const updatedDetails=await User.findOneAndUpdate(
            {email: email}, 
            {
                token: token,
                resetPasswordExpires:Date.now()+5*60*1000,
            },
            {new:true}    
        )
        console.log(updatedDetails)
        // create url
        // url is link of front end
        const url=`http://localhost:3000/update-password/${token}`;
        // send mail to user with url

        await mailSender(email,"password reset link",`Password reset link: ${url}`)

        return res.status(200).json({
            success: true,
            message:"email send succesfully,please check email and change password"
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message:"something went wrong"
        })
    }
    




   
}



// reset password

exports.resetPassword=async(req,res)=>{
    try{
        // data fetch

        const {password,confirmPassword,token}=req.body;
        console.log(password,confirmPassword,token);
        // validationn
        if(password!=confirmPassword){
            return res.status(400).json({
                success: false,
                message:"password not match"
            })
        }
        // get user details from db using token
        const userDetails = await User.findOne({token:token});
        console.log(userDetails);
        // if no entry ->invalid token
        if(!userDetails){
            return res.status(400).json({
                success: false,
                message:"invalid token"
            })
        }
        // check token time 
        // if(!(userDetails.resetPasswordExpires>Date.now())){
        //     return res.status(400).json({
        //         success: false,
        //         message:"token expired"
        //     })
        // }
        // hash password
        const hashedPassword = await bcrypt.hash(password,10)
        // update password
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true}
        )
        console.log("new pass",userDetails.password);
        // return response
        return res.status(200).json({
            success: true,
            message:"password updated and reset succesfully"
        })

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message:"something went wrong"
        })

    }
}