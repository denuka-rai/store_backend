const express = require('express');
const Vendor = require('../models/vendor');
const User = require('../models/user');
const vendorRouter = express.Router();
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



vendorRouter.post('/api/v2/vendor/signup', async(req, res)=>{
  try{

      const {fullName,email,storeName, storeImage, storeDescription,password} = req.body
    
      ///check if the email already exists in the regular user collection
       const existingUserEmail = await User.findOne({email});
       if(existingUserEmail){
        return res.status(400).json({msg:"A user with the same email already exists."})
       }


      const existingEmail = await  Vendor.findOne({email});
   if(existingEmail){
     return res.status(400).json({message: "Vendor with this email already exists"});
   }else{
    //generate salt for hashing the password
    const salt =  await bcrypt.genSalt(10);

    //hash the password using the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);

     let vendor =  new Vendor({fullName,email, storeName, storeImage, storeDescription,password: hashedPassword});
     vendor = await vendor.save();
     res.json({vendor});
   }

    }catch(e){
      res.status(500).json({error: e.message});

    }

});

vendorRouter.post('/api/v2/vendor/signin', async(req, res)=>{

  try{
    const {email, password} = req.body;
   const findVendor = await Vendor.findOne({email});
   if (!findVendor){
    return res.status(400).json({msg: "Vendor not found with this email"});

   }else{
    const  isMatched = await bcrypt.compare(password, findVendor.password);
    if(!isMatched){
      return res.status(400).json({msg: "Incorrect password"});

    }else{
      const token = jwt.sign({id: findVendor._id}, "passwordKey",{expiresIn:"480m"});

      //remove the sensitive information 
      const {password, ...vendorWithoutPassword} = findVendor._doc;

      // send the response back 
      res.json({token, vendorWithoutPassword});
      
    }
    
   }

  }catch(e){
  res.status(500).json({error: e.message});

  }
});


///check token validity 
vendorRouter.post('/vendor-tokenIsValid', async(req, res)=>{

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
  const vendor = await Vendor.findById(verified.id);
  if(!vendor){
    return res.json(false);
  }
 return res.json(true);

  }catch(e){
    return res.status(500).json({error: e.message});
  }

});

vendorRouter.get('/get-vendor', auth, async(req,res)=>{
 try{
   ///retrieve the user data from the database using id from the authenticate user
    const vendor = await Vendor.findById(req.user);
    /// send the user data back to the client, include the user document fields and token
    return res.json({...vendor._doc, token: req.token});

 }catch(e){
    return res.status(500).json({error: e.message});
 }

});


//Fetch all vendor(exclude password)
vendorRouter.get('/api/vendors',async(req,res)=>{
  try{
    const vendor = await Vendor.find().select('-password');//exclude password field
  res.status(200).json(vendor);
  }catch(error){
    res.status(500).json({error:e.message});

  }
});

vendorRouter.put('/api/vendor/:id', async(req,res)=>{
  try{
    const {id} = req.params;

    const{storeImage, storeDescription} = req.body;

    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      {storeImage, storeDescription},
      {new:true},
    )

    if(!updatedVendor){
      return res.status(404).json({error:"Vendor not found"})
    }
    return res.status(200).json(updatedVendor);
  }catch(e){
   res.status(500).json({error:e.message});
  }
});

//Fetch all vendors(exclude password)
vendorRouter.get('/api/vendors',async(req,res)=>{
  try{
    const vendors = await Vendor.find().select('-password');//exclude password field
  res.status(200).json(vendors);
  }catch(error){
    res.status(500).json({error:e.message});

  }
});


module.exports = vendorRouter