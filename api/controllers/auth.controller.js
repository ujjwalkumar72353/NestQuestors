import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";

export const signup = async(req,res)=>{
      const {username,email,password}=req.body;
      const hashpassword = bcryptjs.hashSync(password,10);
      const newuser=new User({username,email,password:hashpassword });
      try{
      await newuser.save();    
      res.status(201).json("user created sucessfully");
      }
      catch(err){
        res.status(500).json(err.message);
      }
}