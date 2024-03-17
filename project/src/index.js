// require('.dotenv').config({path:'./env'})
import dotenv from 'dotenv'

import connectDb from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDb()






/*
First Approach for connecting to db

import mongoose from  "mongoose";
import {DB_NAME} from "./constants";
import express from "express";
const app = express();

;( async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on('error',(error)=>{
        console.log(error);
        throw error;
       })
       app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
       })

    } catch (error) {
        console.log(error);
    }
})()

// use try catch and async await while connecting to database 

*/