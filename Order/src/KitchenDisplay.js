import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://point-of-sale-software-for-belmont-hotel-cvko.onrender.com';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
    fetchOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMenuItemName = (menuItemId) => {
    const menuItem = menuItems.find(item => item.id === menuItemId);
    return menuItem ? menuItem.name : `Item ${menuItemId}`;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // For now, we'll just update locally since the API doesn't have status update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent_to_kitchen': return '#ff9800'; // Orange
      case 'in_progress': return '#2196f3'; // Blue
      case 'ready': return '#4caf50'; // Green
      case 'served': return '#9e9e9e'; // Grey
      default: return '#ff9800';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'sent_to_kitchen': return 'in_progress';
      case 'in_progress': return 'ready';
      case 'ready': return 'served';
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sent_to_kitchen': return 'New Order';
      case 'in_progress': return 'In Progress';
      case 'ready': return 'Ready';
      case 'served': return 'Served';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading orders...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>Java House Kitchen</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '16px' }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} pending
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          fontSize: '18px',
          color: '#666'
        }}>
          No orders at the moment
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.map((order) => (
            <div key={order.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `3px solid ${getStatusColor(order.status)}`
            }}>
              {/* Order Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '15px',
                borderBottom: '1px solid #eee'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#dc2626', fontSize: '20px' }}>
                    Order #{order.id}
                  </h3>
                  <div style={{ color: '#666', marginTop: '5px' }}>
                    Table {order.tableNumber} • {order.customerName}
                  </div>
                  <div style={{ color: '#999', fontSize: '14px', marginTop: '5px' }}>
                    {new Date(order.timestamp).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    backgroundColor: getStatusColor(order.status),
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Items:</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {order.items.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '6px'
                    }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {item.quantity}x {getMenuItemName(item.menuItemId)}
                        </span>
                      </div>
                      <div style={{ color: '#dc2626', fontWeight: 'bold' }}>
                        KSH {(item.price * item.quantity).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 0',
                borderTop: '2px solid #dc2626',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total:</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
                  KSH {order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {getNextStatus(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Mark as {getStatusLabel(getNextStatus(order.status))}
                  </button>
                )}
                <button
                  onClick={() => deleteOrder(order.id)}
                  style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Complete Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={fetchOrders}
          style={{
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Refresh Orders
        </button>
      </div>
    </div>
  );
} 