import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    diagnosedWith:{
        type:String, 
        required:true,
    },
    address:{
        type:String, 
        required:true,
    },
    age:{
        type:Number, 
        required:true,
    },
    bloodGroup:{
        type:Number, 
        required:true,
    },
    gender:{
        type:Number, 
        required:true,
        enum:['male','female','other'],
    },
    admittedIn:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Hospital", 
    },
}, {timestamps: true});

export const Patient = mongoose.model('Patient', patientSchema)