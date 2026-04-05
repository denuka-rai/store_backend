const express = require('express');
const SubCategory = require('../models/sub_category');
const subCategory = require('../models/sub_category');
const subCategoryRouter = express.Router();

subCategoryRouter.post('/api/subcategories', async (req, res) => {

    try {
        const { categoryId, categoryName, image, subCategoryName } = req.body;

        const subCategory = new SubCategory({ categoryId, categoryName, image, subCategoryName });

        await subCategory.save();
        res.status(201).send(subCategory);

    } catch (e) {
        res.status(500).json({ error: e.message });

    }
});


subCategoryRouter.get('/api/subcategories', async (req, res) => {
    try {
        const subCategories = await subCategory.find();
        return res.status(200).json(subCategories);
    } catch (error) {
        res.status(500).json({ error: e.message });
    }

});


subCategoryRouter.get('/api/category/:categoryName/subcategories', async (req, res) => {

    try {
        //extract the categoryName from the request url using Destructuring 
        const { categoryName } = req.params;

        const subCategories = await SubCategory.find({ categoryName: categoryName });

        if (!subCategories || subCategories.length == 0) {
            return res.status(404).json({ error: "Subcategories not found for the given category name" })
        } else {
            return res.status(200).json(subCategories);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

});

module.exports = subCategoryRouter;

