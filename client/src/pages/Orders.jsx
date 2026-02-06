import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import '../styles/Orders.css';

const Orders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            // Use id or fallback to _id for backward compatibility
            const userId = user.id || user._id;
            const response = await ordersAPI.getByUserId(userId);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId, orderNumber) => {
        if (!window.confirm(`Are you sure you want to cancel order ${orderNumber}?`)) {
            return;
        }

        try {
            setLoading(true);
            await ordersAPI.cancel(orderId);
            // Refresh orders list
            await fetchOrders();
            alert('Order cancelled successfully');
        } catch (error) {
            console.error('Error cancelling order:', error);
            const errorMessage = error.response?.data?.message || 'Failed to cancel order';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        const classes = {
            processing: 'status-processing',
            shipped: 'status-shipped',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        };
        return classes[status] || '';
    };

    if (loading) return <div className="loading">Loading orders...</div>;

    if (orders.length === 0) {
        return (
            <div className="empty-orders">
                <h2>No orders yet</h2>
                <p>Start shopping to see your orders here!</p>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <h1>My Orders</h1>

            <div className="orders-list">
                {orders.map(order => (
                    <div key={order._id} className="order-card">
                        <div className="order-header">
                            <div>
                                <h3>Order #{order.orderId}</h3>
                                <p className="order-date">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`order-status ${getStatusClass(order.status)}`}>
                                {order.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="order-items">
                            {order.items.map((item, index) => (
                                <div key={index} className="order-item">
                                    <img src={item.image} alt={item.name} />
                                    <div className="order-item-details">
                                        <p className="item-name">{item.name}</p>
                                        <p className="item-variant">Size: {item.size} | Color: {item.color}</p>
                                        <p className="item-quantity">Quantity: {item.quantity}</p>
                                    </div>
                                    <p className="item-price">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="order-footer">
                            <div className="order-address">
                                <strong>Shipping to:</strong>
                                <p>{order.shippingAddress.addressLine1}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                            </div>
                            <div className="order-total">
                                <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
                            </div>
                        </div>

                        {order.status === 'processing' && (
                            <div className="order-actions">
                                <button
                                    className="cancel-order-btn"
                                    onClick={() => handleCancelOrder(order._id, order.orderId)}
                                    disabled={loading}
                                >
                                    Cancel Order
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;
