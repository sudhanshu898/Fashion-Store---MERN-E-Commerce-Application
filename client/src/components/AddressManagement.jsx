import { useState, useEffect } from 'react';
import { addressAPI } from '../services/api';
import '../styles/AddressManagement.css';

const AddressManagement = () => {
    const [addresses, setAddresses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
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
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await addressAPI.getAll();
            setAddresses(response.data);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const resetForm = () => {
        setFormData({
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
        setShowForm(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                await addressAPI.update(editingId, formData);
            } else {
                await addressAPI.create(formData);
            }
            await fetchAddresses();
            resetForm();
        } catch (error) {
            console.error('Error saving address:', error);
            alert(error.response?.data?.message || 'Error saving address');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (address) => {
        setFormData(address);
        setEditingId(address._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            await addressAPI.delete(id);
            await fetchAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Error deleting address');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await addressAPI.setDefault(id);
            await fetchAddresses();
        } catch (error) {
            console.error('Error setting default:', error);
            alert('Error setting default address');
        }
    };

    return (
        <div className="address-management">
            <div className="address-header">
                <h2>My Addresses</h2>
                {!showForm && (
                    <button className="add-new-btn" onClick={() => setShowForm(true)}>
                        + Add New Address
                    </button>
                )}
            </div>

            {showForm && (
                <form className="address-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? 'Edit Address' : 'Add New Address'}</h3>

                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Full Name *"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number (10 digits) *"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            pattern="\d{10}"
                            required
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Address Line 1 *"
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    />

                    <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    />

                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="City *"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="State *"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="ZIP Code *"
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <select
                            value={formData.addressType}
                            onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                        >
                            <option value="Home">Home</option>
                            <option value="Office">Office</option>
                        </select>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            />
                            Set as default address
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Address'}
                        </button>
                        <button type="button" className="cancel-btn" onClick={resetForm}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="addresses-grid">
                {addresses.map((address) => (
                    <div key={address._id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
                        {address.isDefault && <span className="default-badge">Default</span>}
                        <span className={`type-badge ${address.addressType.toLowerCase()}`}>
                            {address.addressType}
                        </span>

                        <div className="address-details">
                            <h4>{address.fullName}</h4>
                            <p>{address.addressLine1}</p>
                            {address.addressLine2 && <p>{address.addressLine2}</p>}
                            {address.landmark && <p className="landmark">Landmark: {address.landmark}</p>}
                            <p>{address.city}, {address.state} {address.zipCode}</p>
                            <p className="phone">📞 {address.phone}</p>
                        </div>

                        <div className="address-actions">
                            <button className="edit-btn" onClick={() => handleEdit(address)}>
                                Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDelete(address._id)}>
                                Delete
                            </button>
                            {!address.isDefault && (
                                <button className="default-btn" onClick={() => handleSetDefault(address._id)}>
                                    Set as Default
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {addresses.length === 0 && !showForm && (
                <div className="empty-state">
                    <p>No saved addresses yet</p>
                    <button className="add-first-btn" onClick={() => setShowForm(true)}>
                        Add Your First Address
                    </button>
                </div>
            )}
        </div>
    );
};

export default AddressManagement;
