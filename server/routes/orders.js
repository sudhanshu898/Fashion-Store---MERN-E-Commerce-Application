import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
    try {
        const { items, shippingAddress, totalAmount } = req.body;

        // Generate unique order ID
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Update stock for each product variant
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (product) {
                const variant = product.variants.find(
                    v => v.size === item.size && v.color === item.color
                );
                if (variant) {
                    if (variant.stockQuantity < item.quantity) {
                        return res.status(400).json({
                            message: `Insufficient stock for ${product.name} (${item.size}, ${item.color})`
                        });
                    }
                    variant.stockQuantity -= item.quantity;
                    await product.save();
                }
            }
        }

        const order = new Order({
            orderId,
            userId: req.user.id,
            items,
            shippingAddress,
            totalAmount,
            paymentStatus: 'paid' // For now, assume payment is completed
        });

        await order.save();

        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user orders
router.get('/user/:userId', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const orders = await Order.find({ userId: req.params.userId })
            .sort({ orderDate: -1 })
            .populate('userId', 'name email');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get order details
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Cancel order (User only for their own orders)
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Only allow cancellation of processing orders
        if (order.status !== 'processing') {
            return res.status(400).json({
                message: `Cannot cancel order with status: ${order.status}. Only processing orders can be cancelled.`
            });
        }

        // Restore stock for each product variant
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                const variant = product.variants.find(
                    v => v.size === item.size && v.color === item.color
                );
                if (variant) {
                    variant.stockQuantity += item.quantity;
                    await product.save();
                }
            }
        }

        // Update order status to cancelled
        order.status = 'cancelled';
        await order.save();

        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update order status (Admin only)
router.put('/:id/status', auth, admin, async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all orders (Admin only)
router.get('/admin/all', auth, admin, async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ orderDate: -1 })
            .populate('userId', 'name email');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
