import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorhandler } from "../utilis/error.js";
import jwt from 'jsonwebtoken';

export const signup = async(req,res,next)=>{
      const {username,email,password}=req.body;
      const hashpassword = bcryptjs.hashSync(password,10);
      const newuser=new User({username,email,password:hashpassword });
      try{
      await newuser.save();    
      res.status(201).json("user created sucessfully");
      }
      catch(err){
        next(err);
      }
}

export const signin=async(req,res,next)=>{
   const {email,password}=req.body;
   try{
       const validUser= await User.findOne({email});
       if(!validUser){
        return next(errorhandler(404,"user not found"));
       }
       const validpassword=bcryptjs.compareSync(password, validUser.password);
       if(!validpassword){
        return next(errorhandler(401,"wrong cridentials"));
       }
       const token=jwt.sign({id:validUser._id},process.env.JWT_SECRET);
       const {password:pass,...rest}=validUser._doc;
       res
         .cookie('access token',token,{httpOnly:true})
         .status(200)
         .json(rest);
   }
   catch(error){
    next(error);
   }
}