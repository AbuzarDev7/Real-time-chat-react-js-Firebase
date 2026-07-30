import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile } from 'lucide-react';
import Button from '../ui/Button';

const ChatBox = ({ selectedUser, messages = [], onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  if (!selectedUser) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'var(--text-muted)',
      }}>
        <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '30px',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
        }}>
            <Send size={40} style={{ transform: 'rotate(-45deg)', offset: '10px' }} />
        </div>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Select a contact</h2>
        <p>Choose a user from the sidebar to start chatting</p>
      </div>
    );
  }

  return (
    <div className="glass" style={{
      flex: 1,
      margin: '20px 20px 20px 0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            color: 'white',
            fontWeight: '600'
          }}>
            {selectedUser.displayName?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: '600' }}>{selectedUser.displayName}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>typing...</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            style={{
              alignSelf: msg.senderId === 'me' ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
            }}
          >
            <div style={{
              padding: '12px 18px',
              borderRadius: msg.senderId === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.senderId === 'me' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '0.95rem',
              lineHeight: '1.5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              {msg.text}
            </div>
            <div style={{ 
              fontSize: '0.7rem', 
              color: 'var(--text-muted)', 
              marginTop: '4px',
              textAlign: msg.senderId === 'me' ? 'right' : 'left'
             }}>
              12:45 PM
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
        <form 
          onSubmit={handleSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 8px 8px 20px',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <Button variant="ghost" style={{ width: 'auto', padding: '4px' }}><Smile size={22} /></Button>
          <Button variant="ghost" style={{ width: 'auto', padding: '4px' }}><Image size={22} /></Button>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              flex: 1,
              padding: '10px 0',
              fontSize: '1rem',
            }}
          />
          <Button type="submit" style={{ width: 'auto', padding: '10px 20px' }}>
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
