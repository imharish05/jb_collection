import React from 'react';

export default function AccessDenied({ moduleName }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center',
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      maxWidth: 500,
      margin: '40px auto',
    }}>
      <div style={{
        fontSize: 36,
        marginBottom: 20,
        background: '#FEF2F2',
        width: 80,
        height: 80,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#EF4444',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
      }}>🔒</div>
      <h3 style={{
        fontSize: 20,
        fontWeight: 600,
        color: '#111827',
        marginBottom: 8,
        fontFamily: "'Noto Serif', serif"
      }}>Access Restricted</h3>
      <p style={{
        fontSize: 14,
        color: '#6B7280',
        lineHeight: '1.6',
        marginBottom: 28,
        maxWidth: 380,
        fontFamily: "'Noto Serif', serif"
      }}>
        Your current role does not have permission to view {moduleName || 'this page'}. Please contact your system administrator if you believe this is an error.
      </p>
      <button 
        onClick={() => window.location.href = '/dashboard'}
        style={{
          padding: '11px 24px',
          background: 'var(--brand, #b60410)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 14,
          boxShadow: '0 4px 12px rgba(219, 26, 93, 0.25)',
          transition: 'all 0.2s ease',
          fontFamily: "'Noto Serif', serif",
          outline: 'none'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#c21450';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 6px 16px rgba(219, 26, 93, 0.35)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'var(--brand, #b60410)';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(219, 26, 93, 0.25)';
        }}
      >
        Return to Dashboard
      </button>
    </div>
  );
}
