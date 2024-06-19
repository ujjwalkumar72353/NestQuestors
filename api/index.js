import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import cors from "cors";
dotenv.config();

mongoose.connect(process.env.MONGO).then(()=>{
    console.log('connected to MongoDB!');
}).catch((err) => {
    console.log(err);
  })


const app = express();

app.use(express.json());
app.use(cors());

app.listen(3002,()=>{
    console.log('server is running at port 3001!!');
})

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);

app.use((err,req,res,next)=>{
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server error';
    return res.status(statusCode).json({
      success:false,
      statusCode,
      message,
    })
 })