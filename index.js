//importing the express module
const express = require('express')
console.log("Auth router loaded");
const mongoose =  require('mongoose');
require('dotenv').config();
const authRouter = require('./routes/auth');
const bannerRouter = require('./routes/banner');
const categoryRouter = require('./routes/category');
const subCategoryRouter = require('./routes/sub_category');
const productRouter = require('./routes/product');
const productReviewRouter = require('./routes/product_review');
const vendorRouter = require('./routes/vendor');
const orderRouter = require('./routes/order');

const cors = require('cors');//cross-origin resouce sharing


//Define the port number the server will listen on
// const PORT = 3000
const PORT = process.env.PORT || 3000;
//create an instance of an Express application
// because it give us the starting point
const app = express();

//mangoo db connnection
// const DB = "mongodb+srv://denuka456:dbTest123@cluster0.hqehkcf.mongodb.net/?appName=Cluster0"
const DB = process.env.MONGO_URI;


//middleware to register the routes or to mount the routes
app.use(express.json());
app.use(cors()); //enables cors for all routes and origin(domain)

app.use(authRouter);
app.use(bannerRouter);
app.use(categoryRouter);
app.use(subCategoryRouter);
app.use(productRouter);
app.use(productReviewRouter);
app.use(vendorRouter);
app.use(orderRouter);


mongoose.connect(DB).then(()=>{
    console.log("Mongodb connected successfully");
});
 
//start the server and listen on the specified port
app.listen(PORT,"0.0.0.0", function(){
    //Log the number

    console.log(`server is running on port ${PORT}`);
}) 
