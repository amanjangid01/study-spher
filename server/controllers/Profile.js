const Profile=require("../models/Profile");
const User=require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");


exports.updateProfile=async(req,res)=>{
    try{
        // fetch data
        const{dateOfBirth="",about="",contactNumber,gender}=req.body;
        // get userId
        const id=req.user.id;
        // validate
        if(!id||!contactNumber||!gender){
            return res.status(400).json({
                success:false,
                message:"please fill all fields"
            })
        }
        // find profile
        const userDetails = await User.findById(id);
        const profile = await Profile.findById(userDetails.additionalDetails);

        // Update the profile fields
        profile.dateOfBirth = dateOfBirth;
        profile.about = about;
        profile.contactNumber = contactNumber;
        profile.gender = gender;

        // Save the updated profile
        await profile.save();

        // send response
        return res.status(200).json({
            success:true,
            message:"profile updated successfully",
            profile
        })
        

    }
    catch(err){
      console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

// delete details or delete account

exports.deleteAccount=async(req,res)=>{
    try{
        // fetch id
        const id=req.user.id
        // validation
        const userDetails=await User.findById(id);
        if(!userDetails){
            return res.status(400).json({
                success:false,
                message:"something went wrong"
            })
        }
        // delete profile
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});
        // delete user
        await User.findByIdAndDelete({_id:id});
        // send response
        return res.status(200).json({
            success:true,
            message:"account deleted successfully"
        })

        // todo:unenroll user from all enroll courser


    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"something went wrong"
        })

    }
}


// get user details

exports.getAllUserDetails=async(req,res)=>{
    try{
        // get id
        const id=req.user.id;
        
        // get user details
        const userDetails=await User.findById(id).populate("additionalDetails").exec();
        // validattion
        if(!userDetails){
            return res.status(400).json({
                success:false,
                message:"data not found"
            })
        }
        // send response
        return res.status(200).json({
            success:true,
            userDetails
        })
        


    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"something went wrong"
        })

    }
}

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id;
      console.log("meri user id",userId);
      
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      console.log("rew",req);
      const userId = req.user.id
      console.log("meri user id",userId);
      

      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
        
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};