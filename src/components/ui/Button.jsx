import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", ...props }) => {
  const baseStyles = {
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      color: 'white',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-main)',
      border: '1px solid var(--glass-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{ ...baseStyles, ...variants[variant] }}
      className={`btn-hover ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
