
const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema({

    buyerId:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    fullName:{
        type: String,
        required: true,
    },
    productId:{
        type: String,
        requird:true,
    },
    rating:{
        type: Number,
        required: true,
    },
    review:{
        type: String,
        required:true,
    }

});

const ProductReview = mongoose.model("ProductReview", productReviewSchema);
module.exports = ProductReview;