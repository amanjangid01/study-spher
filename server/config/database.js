const mongoose = require('mongoose');

require("dotenv").config();

exports.connect=()=>{
    mongoose.connect(process.env.MONGO_URI)
   .then(()=>{
    console.log("Connected to MongoDB");
    })
    .catch((err)=>{
         console.log("error connecting to MongoDB");
         console.log(err);
         process.exit(1);
    });
}
