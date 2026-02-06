import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v.replace(/[\s-()]/g, ''));
            },
            message: 'Phone number must be 10 digits'
        }
    },
    addressLine1: {
        type: String,
        required: true
    },
    addressLine2: String,
    landmark: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'USA'
    },
    addressType: {
        type: String,
        enum: ['Home', 'Office'],
        default: 'Home'
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    phone: {
        type: String,
        trim: true
    },
    addresses: [addressSchema],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
