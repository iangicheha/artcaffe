import React, { useEffect, useState } from 'react';

// Use your own Artcaffe cloud API by default (can be overridden with REACT_APP_API_URL)
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function OrderQR() {
  // Extract tableId from URL path
  const tableId = window.location.pathname.split('/').pop();
  // Get customer name that was entered on the landing page (via query string)
  const searchParams = new URLSearchParams(window.location.search);
  const initialCustomerName = (searchParams.get('name') || '').trim();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [orderStatus, setOrderStatus] = useState('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Top-level category tabs: FOOD, DRINKS, BAKERY
  const [selectedMainCategory, setSelectedMainCategory] = useState('FOOD');
  // Sub-category within the selected main category (e.g. "Breakfasts"), or "all"
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);

  // Helper to build absolute image URL
  const getImageUrl = (relativePath) => `${API_BASE_URL}${relativePath}`;

  // Normalize any price value (e.g. "KSH 1,290" or 1290) into a number
  const normalizePrice = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
      return Number.isNaN(numeric) ? 0 : numeric;
    }
    return 0;
  };

  useEffect(() => {
    fetchMenu();
    // Fire-and-forget: record a scan for analytics
    try {
      fetch(`${API_BASE_URL}/api/tables/${tableId}/scan`, { method: 'POST' });
    } catch {}
    // eslint-disable-next-line
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching menu from:', `${API_BASE_URL}/api/menu`);
      const response = await fetch(`${API_BASE_URL}/api/menu`);
      console.log('Menu response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Menu data received:', data);
      // Ensure all prices are numeric for safe arithmetic and .toFixed()
      const normalized = data
        .filter(item => item.available)
        .map(item => ({
          ...item,
          price: normalizePrice(item.price),
        }));
      setMenuItems(normalized);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError(`Failed to load menu: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    // Show cart briefly when item is added
    setShowCart(true);
    setTimeout(() => setShowCart(false), 2000);
  };

  const handleRemoveFromCart = (itemId) => {
    const existing = cart.find(i => i.id === itemId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setCart(cart.filter(i => i.id !== itemId));
    }
  };

  const calculateTotal = () =>
    cart.reduce(
      (total, item) => total + normalizePrice(item.price) * item.quantity,
      0
    );

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (cart.length === 0) {
      setError('Please add items to your order');
      return;
    }
    setOrderStatus('submitting');
    setError('');
    try {
      const orderData = {
        tableNumber: tableId,
        customerName: customerName.trim(),
        status: 'sent_to_kitchen',
        type: 'qr',
          items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: normalizePrice(item.price),
          })),
      };
      
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit order');
      }
      
      const result = await response.json();
      
      // Store the submitted order details
      setSubmittedOrder({
        orderId: result.orderId || Math.floor(1000 + Math.random() * 9000).toString(),
        tableNumber: tableId,
        customerName: customerName.trim(),
        items: [...cart],
        total: calculateTotal(),
        timestamp: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      
      setOrderStatus('success');
      setShowOrderConfirmation(true);
      
      // Don't clear cart immediately - let them see the confirmation
    } catch (err) {
      setError('Failed to submit order. Please try again.');
      setOrderStatus('error');
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setCustomerName('');
    setSubmittedOrder(null);
    setShowOrderConfirmation(false);
    setOrderStatus('idle');
    setError('');
  };

  // Helpers to derive main and sub categories from the category string
  const getMainCategory = (category) => (category || '').split('/')[0].trim();
  const getSubCategory = (category) => {
    const parts = (category || '').split('/');
    return parts[1] ? parts[1].trim() : 'Other';
  };

  // Top-level main categories shown in the header (Bakery, Drinks, Food)
  const mainCategories = ['BAKERY', 'DRINKS', 'FOOD'];

  // Sub-categories for the currently selected main category
  const subCategories = [
    'all',
    ...new Set(
      menuItems
        .filter((item) => getMainCategory(item.category) === selectedMainCategory)
        .map((item) => getSubCategory(item.category))
    ),
  ];

  // Filter items by selected main and sub category
  let filteredItems = menuItems.filter(
    (item) => getMainCategory(item.category) === selectedMainCategory
  );

  if (selectedSubCategory !== 'all') {
    filteredItems = filteredItems.filter(
      (item) => getSubCategory(item.category) === selectedSubCategory
    );
  }

  // Order Confirmation Screen
  if (showOrderConfirmation && submittedOrder) {
    return (
      <div style={{ 
        maxWidth: '100%', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif', 
        backgroundColor: '#F0EAD6', 
        minHeight: '100vh',
        padding: '0'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: '#5A3825', 
          color: '#F0EAD6', 
          padding: '20px',
          marginBottom: '0'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>Order Confirmed!</h1>
          <div style={{ fontSize: '16px' }}>Thank you for your order</div>
        </div>

        {/* Order Details */}
        <div style={{ padding: '20px' }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#5A3825', textAlign: 'center' }}>Order Details</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Order ID:</span>
                <span style={{ color: '#666' }}>#{submittedOrder.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Table:</span>
                <span style={{ color: '#666' }}>{submittedOrder.tableNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Customer:</span>
                <span style={{ color: '#666' }}>{submittedOrder.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Time:</span>
                <span style={{ color: '#666' }}>{submittedOrder.timestamp}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Your Order:</h4>
              {submittedOrder.items.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  padding: '8px 0'
                }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                    <span style={{ color: '#666', marginLeft: '8px' }}>x{item.quantity}</span>
                  </div>
                  <span style={{ color: '#5A3825', fontWeight: 'bold' }}>
                    KSH {(item.price * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ 
              borderTop: '2px solid #5A3825', 
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total:</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#5A3825' }}>
                KSH {submittedOrder.total.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div style={{ 
            backgroundColor: 'rgba(90, 56, 37, 0.08)', 
            border: '1px solid #5A3825',
            borderRadius: '8px', 
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#5A3825', fontWeight: 'bold', marginBottom: '8px' }}>
              ✅ Order Successfully Submitted
            </div>
            <div style={{ color: '#333', fontSize: '14px' }}>
              Your order has been sent to the kitchen. We'll prepare it right away!
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleNewOrder}
              style={{
                flex: 1,
                background: '#5A3825',
                color: '#F0EAD6',
                border: 'none',
                borderRadius: '25px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Place New Order
            </button>
          </div>
        </div>

        {/* Contact Information Footer */}
        <div style={{ 
          margin: '20px', 
          background: '#5A3825', 
          padding: '20px 16px', 
          borderRadius: '8px',
          textAlign: 'center',
          color: '#F0EAD6'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold' }}>
            Contact Us
          </div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            Tel: + 254 (0) 707 031829
          </div>
          <div style={{ fontSize: '14px' }}>
            Email: orders@artcaffe.co.ke
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif', 
      backgroundColor: '#F0EAD6', 
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header with Logo and Title */}
      <div style={{ 
        textAlign: 'center', 
        backgroundColor: '#2E7D32', // green header for order page
        color: '#F0EAD6', 
        padding: '10px 16px', // slightly reduced header height
        marginBottom: '0'
      }}>
        {/* Hotel Name */}
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>@Artcaffe</h1>
        
        {/* Table Number */}
        <div style={{ 
          marginBottom: '0',
          padding: '8px 16px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          display: 'inline-block'
        }}>
          <span style={{ fontSize: '16px' }}>Table {tableId}</span>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div style={{ 
          color: '#5A3825', 
          margin: '8px', 
          textAlign: 'center', 
          padding: '12px', 
          backgroundColor: 'rgba(90, 56, 37, 0.08)', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      {orderStatus === 'success' && (
        <div style={{ 
          color: '#5A3825', 
          margin: '8px', 
          textAlign: 'center', 
          padding: '12px', 
          backgroundColor: 'rgba(90, 56, 37, 0.08)', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          Order submitted successfully!
        </div>
      )}

      {/* Main Category Tabs: Bakery, Drinks, Food */}
      <div style={{ 
        margin: '16px 8px 8px', 
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '24px'
        }}>
          {mainCategories.map((main) => {
            const label =
              main === 'BAKERY' ? 'Bakery' : main === 'DRINKS' ? 'Drinks' : 'Food';
            const isSelected = selectedMainCategory === main;
            return (
              <button
                key={main}
                onClick={() => {
                  setSelectedMainCategory(main);
                  setSelectedSubCategory('all');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: '18px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: isSelected ? '#5A3825' : '#555',
                  padding: '8px 4px',
                  borderBottom: isSelected
                    ? '3px solid #5A3825'
                    : '3px solid transparent',
                  transition: 'color 0.2s ease, border-bottom-color 0.2s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-category chips under selected main category */}
      <div style={{ 
        margin: '0 8px 16px', 
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          gap: '8px'
        }}>
          {subCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubCategory(sub)}
              style={{
                padding: '8px 14px',
                backgroundColor:
                  selectedSubCategory === sub ? '#5A3825' : '#e0e0e0',
                color: selectedSubCategory === sub ? '#F0EAD6' : '#333',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedSubCategory === sub ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
              }}
            >
              {sub === 'all' ? 'All' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Summary Bar - Always visible on mobile */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        backgroundColor: '#F0EAD6', 
        padding: '12px 16px', 
        borderBottom: '1px solid #e0e0e0',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Cart: </span>
          <span style={{ color: '#666' }}>{cart.length} items</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#5A3825' }}>
            KSH {calculateTotal().toFixed(0)}
          </span>
          {cart.length > 0 && (
            <button
              onClick={handleSubmitOrder}
              disabled={orderStatus === 'submitting' || !customerName.trim()}
              style={{ 
                background: orderStatus === 'submitting' || !customerName.trim() ? '#ccc' : '#5A3825', 
                color: '#F0EAD6', 
                border: 'none', 
                borderRadius: '20px', 
                padding: '8px 16px', 
                fontSize: '14px', 
                cursor: orderStatus === 'submitting' || !customerName.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {orderStatus === 'submitting' ? 'Submitting...' : 'Submit Order'}
            </button>
          )}
          <button
            onClick={() => setShowCart(!showCart)}
            style={{
              background: '#5A3825',
              color: '#F0EAD6',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {showCart ? 'Hide' : 'View'} Cart
          </button>
        </div>
      </div>

      {/* Cart Section - Expandable on mobile */}
      {showCart && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '16px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h3 style={{ color: '#5A3825', marginBottom: '16px', textAlign: 'center', fontSize: '18px' }}>
            Your Order
          </h3>
          
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No items in cart</div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>KSH {item.price.toFixed(0)} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)} 
                        style={{ 
                          background: '#999999', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '50%', 
                          width: '28px', 
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          lineHeight: '1'
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        onClick={() => handleAddToCart(item)} 
                        style={{ 
                          background: '#5A3825', 
                          color: '#F0EAD6', 
                          border: 'none', 
                          borderRadius: '50%', 
                          width: '28px', 
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          lineHeight: '1'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Submit Order Button in Cart Section */}
              <button
                onClick={handleSubmitOrder}
                disabled={orderStatus === 'submitting' || !customerName.trim()}
                style={{ 
                  background: orderStatus === 'submitting' || !customerName.trim() ? '#ccc' : '#5A3825', 
                  color: '#F0EAD6', 
                  border: 'none', 
                  borderRadius: '25px', 
                  padding: '16px 32px', 
                  fontSize: '16px', 
                  cursor: orderStatus === 'submitting' || !customerName.trim() ? 'not-allowed' : 'pointer', 
                  width: '100%',
                  fontWeight: 'bold',
                  marginTop: '16px'
                }}
              >
                {orderStatus === 'submitting' ? 'Submitting...' : 'Submit Order'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Menu Section */}
      <div style={{ padding: '16px 8px' }}>
        <h3 style={{ 
          color: '#5A3825', 
          marginBottom: '16px', 
          textAlign: 'center',
          fontSize: '20px'
        }}>
          {selectedSubCategory === 'all'
            ? `${selectedMainCategory === 'BAKERY' ? 'Bakery' : selectedMainCategory === 'DRINKS' ? 'Drinks' : 'Food'} Menu`
            : `${selectedSubCategory}`}
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading menu...</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredItems.map(item => (
              <div key={item.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  {/* Item image */}
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #eee',
                      filter: 'brightness(1.08) saturate(1.05)',
                    }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />

                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#2E7D32', fontSize: '16px' }}>{item.name}</h4>
                    <p style={{ margin: '0 0 12px 0', color: '#000000', fontSize: '13px', lineHeight: '1.4' }}>
                      {item.description}
                    </p>
                    <div style={{ color: '#D32F2F', fontWeight: 'bold', fontSize: '16px' }}>
                      KSH {item.price.toFixed(0)}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(item)} 
                    style={{ 
                      background: '#5A3825', 
                      color: '#F0EAD6', 
                      border: 'none', 
                      borderRadius: '25px', 
                      padding: '10px 20px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      minWidth: '60px'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        margin: '24px 8px', 
        background: 'rgba(90, 56, 37, 0.05)', 
        padding: '16px', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#5A3825', fontSize: '16px' }}>How it works:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '20px', color: '#5A3825', marginBottom: '4px' }}>1</div>
            <div style={{ fontSize: '12px', color: '#333' }}>Browse & add items</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', color: '#5A3825', marginBottom: '4px' }}>2</div>
            <div style={{ fontSize: '12px', color: '#333' }}>Review order</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', color: '#5A3825', marginBottom: '4px' }}>3</div>
            <div style={{ fontSize: '12px', color: '#333' }}>Submit & enjoy!</div>
          </div>
        </div>
      </div>

      {/* Contact Information Footer */}
      <div style={{ 
        margin: '24px 8px 16px 8px', 
        background: '#5A3825', 
        padding: '20px 16px', 
        borderRadius: '8px',
        textAlign: 'center',
        color: '#F0EAD6'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold' }}>
          Contact Us
        </div>
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
          Tel: + 254 (0) 707 031829
        </div>
        <div style={{ fontSize: '14px' }}>
          Email: orders@artcaffe.co.ke
        </div>
      </div>
    </div>
  );
} 