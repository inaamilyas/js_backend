import express from "express";

import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//accepting request from specific origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//accept json data
app.use(
  express.json({
    limit: "16kb",
  })
);

// data from url
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));


app.use(cookieParser());

//Routes
import userRouter from './routes/user.routes.js'


// Routes Declaration 
app.use("/api/v1/users", userRouter)

export { app };
