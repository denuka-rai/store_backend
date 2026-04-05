const express = require('express');
const Category = require('../models/category');
const categoryRouter = express.Router();

categoryRouter.post('/api/category',async (req, res)=>{
      console.log("Category API called");

    try{
        const {name, image, banner} = req.body;
        
        const category = new Category({name, image, banner});
        await category.save();
        return res.status(201).send(category);
    }catch(e){
        res.status(500).json({error: e.message});

    }
});

categoryRouter.get('/api/categories',async (req, res)=>{
    

    try{
        const category = await(Category.find()); 
        return res.status(200).send(category);

    }catch(e){
        res.status(500).json({error: e.messagee});

    }
});

module.exports = categoryRouter;