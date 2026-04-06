const express = require('express');
const Product = require('../models/product');
const productRouter = express.Router();
const { auth, vendorAuth } = require('../middleware/auth');

productRouter.post('/api/add-product', vendorAuth, async (req, res) => {
    try {

        const { productName, productPrice, quantity, description, category, vendorId, fullName, subCategory, images, popular, recommend } = req.body;
        const product = new Product({ productName, productPrice, quantity, description, category, vendorId, fullName, subCategory, images, popular, recommend });

        await product.save();


        return res.status(201).send(product);


    } catch (e) {
        return res.status(500).send({ error: e.message });
    }

});

productRouter.get('/api/popular-products', async (req, res) => {
    try {

        const product = await Product.find({ popular: true });
        if (!product || product.length == 0) {
            return res.status(404).json({ error: "No popular products found" })
        } else {
            return res.status(200).json(product);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });

    }
});

productRouter.get('/api/recommended-products', async (req, res) => {
    try {

        const product = await Product.find({ recommend: true });
        if (!product || product.length == 0) {
            return res.status(404).json({ error: "No recommended products found" })
        } else {
            return res.status(200).json(product);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });

    }
});


/// new route for retrieving products by category

productRouter.get('/api/products-by-category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category, popular: true });
        if (!products || products.length == 0) {
            return res.status(404).json({ msg: 'Product not found' });
        } else {
            return res.status(200).json(products);
        }

    } catch (error) {
        res.status(500).json({ error: e.message });

    }
});


///new route for retrieving related product by subcategory
productRouter.get('/api/related-product-by-subcategory/:productId', async (req, res) => {

    try {

        const { productId } = req.params;
        // first, find the product to get its sub category
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ msg: "Product not found" })
        } else {
            //find related product base on the subcategory of the retrieved product
            const relatedProduct = await Product.find({
                subCategory: product.subCategory,
                _id: { $ne: productId }//ne is not include in moongo db
            });

            if (!relatedProduct || relatedProduct.length == 0) {
                return res.status(404).json({ msg: "No related products found" });
            }
            return res.status(200).json(relatedProduct);
        }

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }

});

//routes for retrieving the top10 highest-rated products

productRouter.get('/api/top-rated-products', async (req, res) => {

    try {

        //fetch all products and sort them by averagerating  in decending order
        //sort product by averageRating , with -1 Indicating decending
        const topRatedProducts = await Product.find({}).sort({ averageRating: -1 }).limit(10)

        //check if there are any top-rated product return
        if (!topRatedProducts || topRatedProducts.length == 0) {
            return res.status(404).json({ msg: "No top-rated product found" });

        }
        ///return the top-rated product as a response 
        return res.status(200).json(topRatedProducts);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

productRouter.get('/api/products-by-subcategory/:subcategory', async (req, res) => {

    try {

        const { subcategory } = req.params;
        const products = await Product.fing({ subcategory });
        if (!products || products.length == 0) {
            return res.status(404).json({ msg: "No products found in this subcategory" });

        }
        return res.status(200).json({ error: e.message });
    } catch (e) {
        return res.status(500).json({ error: e.message });

    }

});

///route for searching product by name or description
productRouter.get('/api/search-products', async (req, res) => {

    try {

        ///extract the query parameter from the request query string
        const { query } = req.query;
        ///validate that a query parameter is provided 
        /// if missing return a 400 status with an error message
        if (!query) {
            return res.status(4000).json({ msg: "Query parameter is required" })
        }

        ///search for the product collection for documents where either the 'productName' or description
        ///contains the specified query string
        const products = await Product.find({
            $or: [
                //Regex will mathc the any productName containing the query string
                ///For example if the user search for  "apple", the regix will check
                //if "apple" is part of the productName, so products name "Green apple pie"
                //or "Fresh apples", would march because they contain the word "apple"
                { productName: { $regex: query, $options: "i" } }, //i option makes the search case-insensitive
                { description: { $regex: query, $options: "i" } }
            ]
        });
        ///check if any product were found , if no products match the query 
        ///return a 404 status with an error message
        if (!products || products.length == 0) {
            return res.status(404).json({ msg: "No products found matching the query" })
        }

        ///if products are found return them as a response
        return res.status(200).json(products);

    } catch (e) {
        return res.status(500).json({ error: e.message });

    }

});

///route to edit an existing product
productRouter.put("/api/edit-product/:productId", auth, vendorAuth, async (req, res) => {

    try {

        //extract the productId from the request parameter

        const { productId } = req.params;
        //check if the product exist and if the vendor is authorized to edit it 
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }
        if (product.vendorId.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You are not authorized to edit this product" });
        }

        //desstructure the req.body to exclude the vendorId
        const { vendorId, ...updateData } = req.body;
        //update the product with the field provided in the updateData object
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updateData },// update only the fields provided in updateData
            { new: true });// return the updated product after the update is applied

            return res.status(200).json(updatedProduct);

    } catch (e) {
        return res.status(500).json({ error: e.message });

    }

});

module.exports = productRouter;