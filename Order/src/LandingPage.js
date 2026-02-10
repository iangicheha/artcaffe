import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');

  const handleStartOrdering = () => {
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      // Simple box message if name is missing
      alert('Please enter your name');
      return;
    }
    // Include the name in the URL so the order page can use it
    navigate(`/order/table/1?name=${encodeURIComponent(trimmedName)}`);
  };

  return (
    <div style={{ 
      height: '100vh',           // lock to viewport height
      overflow: 'hidden',        // prevent scrolling (especially on mobile)
      backgroundColor: '#F0EAD6',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Main Content - Centered */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
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

        {/* Customer name input (required before entering menu) */}
        <div style={{ marginBottom: '24px', width: '100%', maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Please enter your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{
              padding: '12px 16px',
              width: '100%',
              fontSize: '16px',
              borderRadius: '25px',
              border: '1px solid #ccc',
              outline: 'none',
              textAlign: 'center'
            }}
          />
        </div>

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
          {customerName.trim() ? 'Continue to Menu' : 'Start Ordering'}
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
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#333',
        color: '#F0EAD6',
        borderRadius: '12px',
        marginTop: '20px'
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