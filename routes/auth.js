const express = require('express')
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRouter = express.Router();

authRouter.post('/api/signup', async(req, res)=>{
  try{

      const {fullName,email,password} = req.body

      const existingEmail = await  User.findOne({email});
   if(existingEmail){
     return res.status(400).json({message: "User with this email already exists"});
   }else{
    //generate salt for hashing the password
    const salt =  await bcrypt.genSalt(10);

    //hash the password using the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);

     let user =  new User({fullName,email, password: hashedPassword});
     user = await user.save();
     res.json({user});
   }

    }catch(e){
      res.status(500).json({error: e.message});

    }

});

//siginin api endpoint
authRouter.post('/api/signin', async(req, res)=>{

  try{
    const {email, password} = req.body;
   const findUser = await User.findOne({email});
   if (!findUser){
    return res.status(400).json({msg: "User not found with this email"});

   }else{
    const  isMatched = await bcrypt.compare(password, findUser.password);
    if(!isMatched){
      return res.status(400).json({msg: "Incorrect password"});

    }else{
      const token = jwt.sign({id: findUser._id}, "passwordKey");

      //remove the sensitive information 
      const {password, ...userWithoutPassword} = findUser._doc;

      // send the response back 
      res.json({token, user: userWithoutPassword});
      
    }
    
   }

  }catch(e){
  res.status(500).json({error: e.message});

  }
});


authRouter.put('/api/users/:id', async(req,res)=>{
  try{
    const {id} = req.params;

    const{state, city, locality} = req.body;
    ///find the user by their ID and update the state,city, localityField
    ///the {new:true} option ensure the updated document is required
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {state, city, locality},
      {new:true},
    )

    // if no user is found return 404 
    if(!updatedUser){
      return res.status(404).json({error:"User not found"})
    }
    return res.status(200).json(updatedUser);
  }catch(e){
   res.status(500).json({error:e.message});
  }
});

//Fetch all users(exclude password)
authRouter.get('/api/users',async(req,res)=>{
  try{
    const users = await User.find().select('-password');//exclude password field
  res.status(200).json(users);
  }catch(error){
    res.status(500).json({error:e.message});

  }
});

module.exports = authRouter;