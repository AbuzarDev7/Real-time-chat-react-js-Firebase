import React from 'react';

const Input = ({ label, icon: Icon, type = "text", placeholder, value, onChange, ...props }) => {
  return (
    <div style={{ marginBottom: '20px', width: '100%' }}>
      {label && <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</label>}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '0 16px',
        transition: 'all 0.3s ease',
      }} className="input-container">
        {Icon && <Icon size={20} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            background: 'transparent',
            width: '100%',
            padding: '12px 0',
            color: 'var(--text-main)',
            fontSize: '1rem',
          }}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;
