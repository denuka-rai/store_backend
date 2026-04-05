const express = require('express');
const ProductReview = require('../models/product_review');
const Product = require('../models/product');


const productReviewRouter = express.Router();

productReviewRouter.post('/api/product-review', async (req, res) => {

    try {

        const { buyerId, email, fullName, productId, rating, review } = req.body;
        ///check if the user has alread reviewed the product
       const  existReview = await ProductReview.findOne({buyerId, productId});
        if(existReview){
           return res.status(400).json({msg: "You have a already reviewed this product"});
        }
        const reviews = new ProductReview({ buyerId, email, fullName, productId, rating, review });
        await reviews.save();

        ///find the product associates with the reviews using the productID
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({msg: "product not found"});
        }
        ///updste the totalRating by incrementing it by w
        product.totalRating = +1;
        product.averageRating = ((product.averageRating *(product.totalRating-1)) + rating) / product.totalRating;
        //save the updated product back to the database
        await product.save();
        return res.status(201).json(reviews);
    

    } catch (e) {
        res.status(500).json({ error: e.message });
    }

}
);

productReviewRouter.get('/api/reviews', async (req, res) => {
    try {

        const reviews = await ProductReview.find();
        return res.status(200).json(reviews);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})

module.exports = productReviewRouter;