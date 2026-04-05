const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Vendor = require('../models/vendor');


///authentication middleware 
// this middkeware fuction check if the user is authenticates


const auth = async(req,res,next)=>{
    try{
        ///extract the token from the request headers
        const token = req.header('x-auth-token');

     if(!token) return res.status(401).json({msg:'No authentication token, authorization denied'});

     ///verify jwt token using the secrete key
     const verfied = jwt.verify(token,'passwordKey');
     if(!verfied)
        return res.status(401).json({msg: "Token verification failed, authorization denied"});

     ///find the normal user or vendor in the database using the id stored in the token payload

    const user = await User.findById(verfied.id)|| await Vendor.findById(verfied.id);
    if(!user) return res.status(401).json({msg:"User or Vendor not found, authorization denied"});

    ///attract the authenticated user (whether a normal use or vendor )to request objects
    /// this makes the user's data available to any subsequent middleware are route handlers


    req.user = user;
    //also attact the token to the request object incase is needed later

    //proceed to the next middleware or router handler
    next();


    }catch(error){

        res.status(500).json({error: e.message});
    }
};

///vedor Authenticatioon middleware
/// this middleware ensures that user making the request is a. vendor
/// it should be used for routes that only vendor can access

const vendorAuth = (req, res, next)=>{
    try{

         ///check if. the user making the request is a vendor (by checking the 'role' property)
    if(!req.User.role || req.user.role !== 'Vendor'){
        /// if the user is not a vendor, return 403 (Forbidden)(respone with an error message)
        return res.status(403).json({msg: "Access denied, only vendors are allowed"});

    }

    /// if the user is a vendor , procceed to the next middleware or route handler
    next();

    }catch(e){
        return res.status(500).json({error:e.message});

    }
   
}

module.exports = {auth,vendorAuth};