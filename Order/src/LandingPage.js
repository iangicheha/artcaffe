import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Lock body scroll on mobile when landing page is shown
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTouchAction = document.documentElement.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.documentElement.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.documentElement.style.touchAction = prevTouchAction;
    };
  }, []);

  const handleStartOrdering = () => {
    if (!showNameInput) {
      setShowNameInput(true);
      return;
    }
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      alert('Please enter your name');
      return;
    }
    navigate(`/order/table/1?name=${encodeURIComponent(trimmedName)}`);
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '100vw',
      maxHeight: '100dvh',
      overflowX: 'hidden',
      overflowY: showNameInput ? 'auto' : 'hidden',
      backgroundColor: '#F0EAD6',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Main Content - Centered */}
      <div style={{ 
        flex: showNameInput ? 'none' : 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: showNameInput ? 'flex-start' : 'center',
        alignItems: 'center',
        alignSelf: 'center',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        textAlign: 'center',
        paddingTop: showNameInput ? '10px' : 0
      }}>
        {/* Hotel Logo */}
        <div style={{
          marginBottom: '40px'
        }}>
          <img 
            src="/logo.png" 
            alt="Artcafe Logo" 
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              backgroundColor: 'white',
              padding: '10px'
            }}
          />
        </div>

        {/* Hotel Name */}
        <h1 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '32px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          @Artcaffe
        </h1>

        {/* Restaurant Menu Title */}
        <h2 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '28px', 
          fontWeight: 'normal',
          color: '#333'
        }}>
          Restaurant Menu
        </h2>

        {/* Customer name input - shown only after clicking Start Ordering */}
        {showNameInput && (
          <div style={{ marginBottom: '20px', width: '100%', maxWidth: '220px' }}>
            <input
              type="text"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{
                padding: '8px 12px',
                width: '100%',
                fontSize: '14px',
                borderRadius: '20px',
                border: '1px solid #ccc',
                outline: 'none',
                textAlign: 'center'
              }}
            />
          </div>
        )}

        {/* Start Ordering Button */}
        <button
          onClick={handleStartOrdering}
          style={{
            background: '#5A3825', // deep coffee brown
            color: '#F0EAD6',
            border: 'none',
            borderRadius: '30px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {showNameInput ? 'Continue to Menu' : 'Start Ordering'}
        </button>

        {/* Instructions */}
        <div style={{ 
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          maxWidth: '400px'
        }}>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            color: '#333',
            fontWeight: 'bold'
          }}>
            How to Order:
          </p>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '14px', 
            color: '#666',
            lineHeight: '1.5'
          }}>
            1. Scan the QR code on your table
          </p>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '14px', 
            color: '#666',
            lineHeight: '1.5'
          }}>
            2. Browse our delicious menu
          </p>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '14px', 
            color: '#666',
            lineHeight: '1.5'
          }}>
            3. Place your order directly
          </p>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            color: '#666',
            lineHeight: '1.5'
          }}>
            4. Enjoy your meal!
          </p>
        </div>
      </div>

      {/* Contact Information Footer */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#5A3825',
        color: '#F0EAD6',
        marginTop: '20px',
        marginLeft: '-20px',
        marginRight: '-20px',
        width: 'calc(100% + 40px)'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 'bold' }}>
          Contact Us
        </div>
        <div style={{ fontSize: '16px', marginBottom: '4px' }}>
          Tel: + 254 (0) 707 031829
        </div>
        <div style={{ fontSize: '16px' }}>
          Email: orders@artcaffe.co.ke
        </div>
      </div>
    </div>
  );
} 