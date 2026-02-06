import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all addresses for logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new address
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newAddress = req.body;

        // If this is set as default, unset other defaults
        if (newAddress.isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // If this is the first address, make it default
        if (user.addresses.length === 0) {
            newAddress.isDefault = true;
        }

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({
            message: 'Address added successfully',
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update address
router.put('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(req.params.id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If setting as default, unset other defaults
        if (req.body.isDefault && !address.isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // Update address fields
        Object.assign(address, req.body);
        await user.save();

        res.json({
            message: 'Address updated successfully',
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(req.params.id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = address.isDefault;
        address.deleteOne();

        // If deleted address was default and other addresses exist, set first one as default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json({
            message: 'Address deleted successfully',
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Set address as default
router.put('/:id/default', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(req.params.id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Unset all defaults
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });

        // Set this address as default
        address.isDefault = true;
        await user.save();

        res.json({
            message: 'Default address updated successfully',
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
