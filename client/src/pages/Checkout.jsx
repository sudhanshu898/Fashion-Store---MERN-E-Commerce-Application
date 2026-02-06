import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, authAPI, addressAPI } from '../services/api';
import OrderSummary from '../components/OrderSummary';
import '../styles/Checkout.css';

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newAddress, setNewAddress] = useState({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        addressType: 'Home',
        isDefault: false
    });

    useEffect(() => {
        if (cart.length === 0) {
            navigate('/cart');
        }
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await addressAPI.getAll();
            setAddresses(response.data || []);
            const defaultAddr = response.data?.find(a => a.isDefault);
            if (defaultAddr) setSelectedAddress(defaultAddr);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const response = await addressAPI.create(newAddress);
            setAddresses(response.data.addresses);
            setSelectedAddress(newAddress);
            setShowAddressForm(false);
            setNewAddress({
                fullName: '',
                phone: '',
                addressLine1: '',
                addressLine2: '',
                landmark: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'USA',
                addressType: 'Home',
                isDefault: false
            });
        } catch (error) {
            console.error('Error adding address:', error);
            alert(error.response?.data?.message || 'Error adding address');
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            alert('Please select a shipping address');
            return;
        }

        setLoading(true);
        try {
            const shipping = 10.00;
            const tax = getCartTotal() * 0.08;
            const totalAmount = getCartTotal() + shipping + tax;

            await ordersAPI.create({
                items: cart,
                shippingAddress: selectedAddress,
                totalAmount
            });

            clearCart();
            navigate('/orders');
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-page">
            <h1>Checkout</h1>

            <div className="checkout-container">
                <div className="checkout-main">
                    <section className="shipping-section">
                        <h2>Shipping Address</h2>

                        {addresses.length > 0 && (
                            <div className="saved-addresses">
                                {addresses.map((addr) => (
                                    <label key={addr._id} className="address-option">
                                        <input
                                            type="radio"
                                            name="address"
                                            checked={selectedAddress?._id === addr._id}
                                            onChange={() => setSelectedAddress(addr)}
                                        />
                                        <div className="address-content">
                                            <div className="address-header-checkout">
                                                <strong>{addr.fullName}</strong>
                                                <span className={`address-type-badge ${addr.addressType.toLowerCase()}`}>
                                                    {addr.addressType}
                                                </span>
                                                {addr.isDefault && <span className="default-tag">Default</span>}
                                            </div>
                                            <p>{addr.addressLine1}</p>
                                            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                                            {addr.landmark && <p className="landmark-text">Landmark: {addr.landmark}</p>}
                                            <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                                            <p className="phone-number">📞 {addr.phone}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        {!showAddressForm ? (
                            <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>
                                + Add New Address
                            </button>
                        ) : (
                            <form onSubmit={handleAddAddress} className="address-form">
                                <div className="checkout-form-row">
                                    <input
                                        type="text"
                                        placeholder="Full Name *"
                                        value={newAddress.fullName}
                                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone (10 digits) *"
                                        value={newAddress.phone}
                                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        pattern="\d{10}"
                                        required
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Address Line 1 *"
                                    value={newAddress.addressLine1}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Address Line 2 (Optional)"
                                    value={newAddress.addressLine2}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Landmark (Optional)"
                                    value={newAddress.landmark}
                                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                                />
                                <div className="checkout-form-row">
                                    <input
                                        type="text"
                                        placeholder="City *"
                                        value={newAddress.city}
                                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="State *"
                                        value={newAddress.state}
                                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="ZIP Code *"
                                        value={newAddress.zipCode}
                                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <select
                                    value={newAddress.addressType}
                                    onChange={(e) => setNewAddress({ ...newAddress, addressType: e.target.value })}
                                    className="address-type-select"
                                >
                                    <option value="Home">Home</option>
                                    <option value="Office">Office</option>
                                </select>
                                <div className="form-actions">
                                    <button type="submit" className="save-address-btn">Save Address</button>
                                    <button type="button" className="cancel-btn" onClick={() => setShowAddressForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>

                <div className="checkout-sidebar">
                    <OrderSummary items={cart} total={getCartTotal()} />
                    <button
                        className="place-order-btn"
                        onClick={handlePlaceOrder}
                        disabled={loading || !selectedAddress}
                    >
                        {loading ? 'Placing Order...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
