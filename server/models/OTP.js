const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const emailTemplate = require('../mail/templates/emailVerificationTemplate');

const OTPSchema=new mongoose.Schema({

    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:5*60
    }

})




// pre and post midleware yaha likhenge(schema ke baad aur model se uper)...becoz db me entry tabhi hogi jb email vala otp daalenge and verify kerenge....means db ki entry se phle mail send krenge...so pre middleware(utils->mailSender) hook use krnge...we will write in util foled and then fetch


async function sendVerificationEmail(email,otp){
    try{
        const mailResponse=await mailSender(email,"verification email from study Notoin",emailTemplate(otp));

        console.log("email send succesfully",mailResponse.response);

    }
    catch(err){
        console.log("Error occurred while sending email: ",err);
        throw err;
    }
}


OTPSchema.pre("save",async function(next){
    console.log("New document saved to database");

    if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
    next();
})

module.exports=mongoose.model('OTP',OTPSchema);