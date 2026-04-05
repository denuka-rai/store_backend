const express = require('express');
const Order = require('../models/order');
const orderRouter = express.Router();
const {auth, vendorAuth} = require('../middleware/auth');


///Post route for creating orders

orderRouter.post('/api/orders', auth,async (req, res) => {

    try {
        const {
            fullName,
            email,
            state,
            city,
            locality,
            productName,
            productPrice,
            quantity,
            category,
            image,
            buyerId,
            vendorId,
        } = req.body;
        const createdAt = new Date().getMilliseconds()//Get the current Date

        //create new order instance with the extracted field

        const order = new Order({
            fullName,
            email,
            state,
            city,
            locality,
            productName,
            productPrice,
            quantity,
            category,
            image,
            buyerId,
            vendorId,
            createdAt,
        });

        await order.save();
        return res.status(201).json(order)

    } catch (e) {
        res.status(500).json({ error: e.message });

    }
});
/// GET route for fetching orders by buyer ID
orderRouter.get('/api/orders/:buyerId', auth, async (req, res) => {
    try {

        const { buyerId } = req.params;
        const orders = await Order.find({ buyerId });

        if (orders.length == 0) {
            return res.status(404).json({ msg: "No order found" });
        }
        return res.status(200).json(orders);
    } catch (e) {
        res.status(500).json({ error: e.message });

    }

});

///Delete method for deleting orders

orderRouter.delete('/api/orders/:id', auth,async (req, res) => {

    try {

        // extract the id from the request parameters
        const { id } = req.params;
        //find and delete the order from the database using the extracted _id
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) {
            // if no order was found with the provided id
            return res.status(404).json({ msg: "Order not found" });
        } else {
            return res.status(200).json({ msg: "Your order has been deleted successfully" })
        }

    } catch (e) {
        res.status(500).json({ error: e.message });
    }

});

/// GET route for fetching orders by Vendor ID
orderRouter.get('/api/orders/vendors/:vendorId',vendorAuth, async (req, res) => {
    try {

        const { vendorId } = req.params;
        const orders = await Order.find({ vendorId });

        if (orders.length == 0) {
            return res.status(404).json({ msg: "No order found" });
        }
        return res.status(200).json(orders);
    } catch (e) {
        res.status(500).json({ error: e.message });

    }

});

orderRouter.patch('/api/orders/:id/delivered', async (req, res) => {
    try {

        const { id } = req.params;
      const updatedOrder =  await Order.findByIdAndUpdate(
            id,
            { delivered: true, processing:false},
            { new: true }
        );

        if(!updatedOrder){
            return res.status(404).json({msg:"Order not found"});
        }
        return res.status(200).json(updatedOrder);
    } catch (e) {
      res.status(500).json({error:e.message});
    }

});


orderRouter.patch('/api/orders/:id/processing', async (req, res) => {
    try {

        const { id } = req.params;
      const cancelOrder =  await Order.findByIdAndUpdate(
            id,
            { processing: false,delivered:false},
            { new: true }
        );

        if(!cancelOrder){
            return res.status(404).json({msg:"Order not found"});
        }
        return res.status(200).json(cancelOrder);
    } catch (e) {
      res.status(500).json({error:e.message});
    }

});

orderRouter.get('/api/orders',async (req, res)=>{
    

    try{
        const order = await(Order.find()); 
        return res.status(200).send(order);

    }catch(e){
        res.status(500).json({error: e.messagee});

    }
});



module.exports = orderRouter;