const express = require('express')
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRouter = express.Router();
const Vendor = require('../models/vendor');
const { auth } = require('../middleware/auth');
const sendOtpEmail = require('../helper/send_email');
const crypto = require('crypto');


const otpStore = new Map();

authRouter.post('/api/signup', async(req, res)=>{
  try{

      const {fullName,email,password} = req.body
      ///check if the account has been created by a vendor before
        const existingVendorEmail = await Vendor.findOne({email});
        if(existingVendorEmail){
          return res.status(400).json({msg:"A vendor with the same email already exists."})
        }

      const existingEmail = await  User.findOne({email});
   if(existingEmail){
     return res.status(400).json({message: "User with this email already exists"});
   }else{
    //generate salt for hashing the password
    const salt =  await bcrypt.genSalt(10);

    //hash the password using the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);

    ///Generate OTP
    const otp = crypto.randomInt(100000,999999).toString();
    //save the otp in temporary store with email as key
    otpStore.set(email, {otp, expiresAt: Date.now() +10*60*1000});///expires in 10 minutes
     let user =  new User({fullName,email, password: hashedPassword, isVerified: false});
     user = await user.save();
     ///send otp vai email
    emailResponse = await sendOtpEmail(email, otp);
        res.status(201).json({msg:"Signup successful. Please check your email for the OTP to verify your account.",emailResponse});
   }

    }catch(e){
      res.status(500).json({error: e.message});

    }

});

///check token validity 
authRouter.post('/tokenIsValid', async(req, res)=>{

  try{
    const token = req.header('x-auth-token');
    if(!token){
      return res.json(false);///if no token is provided return false
    }
    const verified = jwt.verify(token, "passwordKey");
    if(!verified){
      return res.json(false);///if token is invalid return false
    }
   ///if verification (expired or invalid) , jwt.verify will throw an error 
  const user = await User.findById(verified.id);
  if(!user){
    return res.json(false);
  }
 return res.json(true);

  }catch(e){
    return res.status(500).json({error: e.message});
  }

});

///define a Get Route for the authenticated user
authRouter.get('/', auth, async(req,res)=>{
 try{
   ///retrieve the user data from the database using id from the authenticate user
    const user = await User.findById(req.user);
    /// send the user data back to the client, include the user document fields and token
    return res.json({...user._doc, token: req.token});

 }catch(e){
    return res.status(500).json({error: e.message});
 }

});


///verify OTP route
authRouter.post('/api/verify-otp', async (req, res)=>{
 try{
  const {email, otp} = req.body;
  const storedOtpData = otpStore.get(email);
  if(!storedOtpData){
    return res.status(400).json({msg: "No OTP found for this email. Please request a new one."});
  }
  if (storedOtpData.otp !== otp){
    return res.status(400).json({msg: "Incalid OTP. Please enter the correct OTP sent to your email."});
  }
  ///check if OTP is expired
if(storedOtpData.expiresAt < Date.now()){
  otpStore.delete(email);
  return res.status(400).json({msg:"OTP has expired. Please reques a new one."})
}
///mark user as verified
const user = await User.findOneAndUpdate({email}, {isVerified: true},   { returnDocument: 'after' }
);
if(!User){
  return res.status(404).json({msg: "User not found"});

}
otpStore.delete(email);

return res.status(200).json({msg:"Email verified successfully.", user});
 }catch(e){

 }
})

//siginin api endpoint
authRouter.post('/api/signin', async(req, res)=>{

  try{
    const {email, password} = req.body;
   const findUser = await User.findOne({email});

   //check if user is verified
   if(!findUser.isVerified){
    return res.status(403).json({msg: "Please verify your email before signing in"});
   }

   if (!findUser){
    return res.status(400).json({msg: "User not found with this email"});

   }else{
    const  isMatched = await bcrypt.compare(password, findUser.password);
    if(!isMatched){
      return res.status(400).json({msg: "Incorrect password"});

    }else{
      const token = jwt.sign({id: findUser._id}, "passwordKey",{expiresIn:"20m"});

      //remove the sensitive information 
      const {password, ...userWithoutPassword} = findUser._doc;

      // send the response back 
      res.json({token, userWithoutPassword});
      
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


//Delete user of vendor API
authRouter.delete('/api/user/delete-account/:id', auth, async(req, res)=>{

  try{

    ///extract the id from the request param
    const {id}= req.params;
    ///check if a regular user or vendor with the provided id exists in database
  const user =  await User.findById(id);
  const vendor = await Vendor.findById(id);
  if(!user && !vendor){
    return res.status(404).json({msg:"User or Vendor not found"});

  }

  ///Delet the user or vendor based on their type
  if(user){
    await User.findByIdAndDelete(id);
    return res.status(200).json({msg:"User deleted successfully"});

  }else if (vendor){
    await Vendor.findByIdAndDelete(id);
    return res.status(200).json({msg:"Vendor deleted successfully"});
  }

  }catch(e){
   return res.status(500).json({error:e.message});
  }

});

module.exports = authRouter;