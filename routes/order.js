const express = require('express');
const Order = require('../models/order');
const orderRouter = express.Router();
require('dotenv').config();
const { auth, vendorAuth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

///Post route for creating orders

orderRouter.post('/api/orders', auth, async (req, res) => {

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
            paymentStatus,
            paymentIntentId,
            paymentMethod,
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
            paymentStatus,
            paymentIntentId,
            paymentMethod,
        });

        await order.save();
        return res.status(201).json(order)

    } catch (e) {
        res.status(500).json({ error: e.message });

    }
});



///Payment API
// orderRouter.post('/api/payment', async (req, res) => {

//     try {
//         const { orderId, paymentMethodId, currency = "usd" } = req.body;
//         if (!orderId || !paymentMethodId || !currency) {
//             return res.status(400).json({
//                 msg:"Missing required fields"
//             });
//         }

//         ///Query for the order by orderID
//         const order = await Order.findById(orderId);;
//         if(!order){
//             console.log("Order not found");
//             return res.status(404).json({msg:"Order not found"});

//         }

//         ///calculate the total amount to be charged(price * quantity)
//         const totalAmount = order.productPrice * order.quantity;
//         ///ensure the amount os at least $0.50 USD or its equivalent
//         const minimumAmount = 0.50; 
//         if(totalAmount< minimumAmount){
//             return res.status(400).json({msg:"Amount must be at least $0.50 USD"});
//         }
//     ///convert the total amount to cents(Stripe requires amounts in cents) 
//     const amountInCents = Math.round(totalAmount * 100);

//     ///Now create a payment intent with the correct amount 
//     const paymentIntent = await stripe.paymentIntents.create({

//         amount : amountInCents,
//         currency: currency,
//         payment_method: paymentMethodId,
//         automatic_payment_methods:{enabled:true},

//     });
//     console.log("Payment Status::",paymentIntent.status);
//     return res.status(200).json({
//         status:"Success",
//         paymentIntentId: paymentIntent.id,
//         amount: paymentIntent.amount / 100, ///convert back to dollars
//         currency:paymentIntent.currency,

//     })


//     }catch(e){

//         res.status(500).json({error:e.message});

//     }

// });


orderRouter.post('/api/payment-intent', async (req, res) => {

    try {
        const { amount, currency } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
        });

        return res.status(200).json(paymentIntent);
    } catch (e) {

        return res.status(500).json({ error: e.message });
    }

});

orderRouter.get('/api/payment-intent/:id', auth, async (req, res) => {
    try {

        const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
        return res.status(200).json(paymentIntent);

    } catch (e) {
        return res.status(500).json({ error: e.message });

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

orderRouter.delete('/api/orders/:id', auth, async (req, res) => {

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
orderRouter.get('/api/orders/vendors/:vendorId', vendorAuth, async (req, res) => {
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
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { delivered: true, processing: false },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ msg: "Order not found" });
        }
        return res.status(200).json(updatedOrder);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

});


orderRouter.patch('/api/orders/:id/processing', async (req, res) => {
    try {

        const { id } = req.params;
        const cancelOrder = await Order.findByIdAndUpdate(
            id,
            { processing: false, delivered: false },
            { new: true }
        );

        if (!cancelOrder) {
            return res.status(404).json({ msg: "Order not found" });
        }
        return res.status(200).json(cancelOrder);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

});

orderRouter.get('/api/orders', async (req, res) => {


    try {
        const order = await (Order.find());
        return res.status(200).send(order);

    } catch (e) {
        res.status(500).json({ error: e.messagee });

    }
});





module.exports = orderRouter;