import React from 'react';
import { Search, LogOut, MessageSquare, Users } from 'lucide-react';
import Button from '../ui/Button';

const Sidebar = ({ users = [], currentUser, onLogout }) => {
  return (
    <div className="glass" style={{
      width: '320px',
      height: 'calc(100vh - 40px)',
      margin: '20px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Sidebar Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Chats</h2>
          <Button variant="ghost" onClick={onLogout} style={{ padding: '8px', width: 'auto' }}>
            <LogOut size={20} />
          </Button>
        </div>
        
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '0 12px',
        }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search users..." 
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px',
              color: 'var(--text-main)',
              width: '100%',
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>

      {/* User List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {users.length > 0 ? (
          users.map((user) => (
            <div 
              key={user.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '4px',
              }}
              className="user-item"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                fontWeight: '700',
                color: 'white',
                fontSize: '1.2rem',
              }}>
                {user.displayName?.charAt(0) || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.online ? '#10b981' : '#64748b' }}></span>
                  {user.online ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ marginBottom: '12px', opacity: 0.2 }} />
            <p>No active users found</p>
          </div>
        )}
      </div>

      {/* Current User Info */}
      <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
          }}>
            <User size={20} color="white" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.displayName || 'My Profile'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder icon if User is not imported
const User = ({ size, color }) => <Users size={size} color={color} />;

export default Sidebar;
