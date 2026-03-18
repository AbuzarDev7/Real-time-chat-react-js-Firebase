import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, LogOut, Search, User, Users, Send, Image, Smile, Phone, Video, MoreVertical } from 'lucide-react';
import { auth, database } from '../firebaseconfig/firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, push, set, serverTimestamp, onDisconnect, update } from 'firebase/database';
import avatarIcon from '../assets/images/avatar_icon.png';

const Home = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollRef = React.useRef(null);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    
    const myUserRef = ref(database, `users/${currentUser.uid}`);
    set(myUserRef, {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      email: currentUser.email,
      online: true,
      lastSeen: serverTimestamp()
    });

    
    const onDisconnectRef = onDisconnect(myUserRef);
    onDisconnectRef.update({
      online: false,
      lastSeen: serverTimestamp()
    });

    // Fetch users from Realtime Database
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.values(data).filter(user => user.uid !== currentUser.uid);
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    });

    return () => {
      unsubscribe();
      // Set offline on component unmount
      set(myUserRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        online: false,
        lastSeen: serverTimestamp()
      });
    };
  }, [currentUser, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, remoteTyping]);

  // Fetch messages and typing status when a user is selected
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const chatId = currentUser.uid > selectedUser.uid 
      ? `${currentUser.uid}_${selectedUser.uid}` 
      : `${selectedUser.uid}_${currentUser.uid}`;

    // Messages listener
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.values(data);
        setMessages(msgList);
      } else {
        setMessages([]);
      }
    });

    // Typing status listener
    const typingRef = ref(database, `chats/${chatId}/typing/${selectedUser.uid}`);
    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      setRemoteTyping(snapshot.val() === true);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [selectedUser, currentUser]);

  // Handle local typing indicator
  useEffect(() => {
    if (!selectedUser || !currentUser || !inputText.trim()) {
      if (isTyping) {
        const chatId = currentUser.uid > selectedUser.uid 
          ? `${currentUser.uid}_${selectedUser.uid}` 
          : `${selectedUser.uid}_${currentUser.uid}`;
        set(ref(database, `chats/${chatId}/typing/${currentUser.uid}`), false);
        setIsTyping(false);
      }
      return;
    }

    const chatId = currentUser.uid > selectedUser.uid 
      ? `${currentUser.uid}_${selectedUser.uid}` 
      : `${selectedUser.uid}_${currentUser.uid}`;

    if (!isTyping) {
      set(ref(database, `chats/${chatId}/typing/${currentUser.uid}`), true);
      setIsTyping(true);
    }

    const timeout = setTimeout(() => {
      set(ref(database, `chats/${chatId}/typing/${currentUser.uid}`), false);
      setIsTyping(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [inputText, selectedUser, currentUser, isTyping]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSendMessage = async (e, imageUrl = null) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !imageUrl || !selectedUser) return;

    const chatId = currentUser.uid > selectedUser.uid 
      ? `${currentUser.uid}_${selectedUser.uid}` 
      : `${selectedUser.uid}_${currentUser.uid}`;

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      text: inputText,
      imageUrl: imageUrl,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      type: imageUrl ? 'image' : 'text'
    });

    setInputText('');
  };

  const handleImageUpload = () => {
    if (window.cloudinary) {
      const myWidget = window.cloudinary.createUploadWidget(
        {
          cloudName: 'dfu6dxt8o',
          uploadPreset: 'user-img',
          theme: 'dark',
          colors: {
            active: '#6366f1'
          }
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            const url = result.info.secure_url;
            handleSendMessage(null, url);
          }
        }
      );
      myWidget.open();
    } else {
      console.error("Cloudinary script not loaded");
    }
  };


  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden relative">
      <div className={`flex w-full h-full p-2 md:p-5 gap-0 md:gap-5 transition-transform duration-300 ${!showSidebar && selectedUser ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
      
      {/* Sidebar */}
      <div className={`glass w-full md:w-[350px] shrink-0 flex flex-col overflow-hidden`}>
        {/* User Profile - Prominent at Top */}
        <div className="p-6 bg-white/[0.04] border-b border-white/10 flex items-center shadow-lg shadow-black/20">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mr-4 border border-white/10 shadow-xl">
              <img src={avatarIcon} alt="Me" className="w-10 h-10 opacity-90" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold text-white truncate text-lg">{currentUser?.displayName}</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-normal uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Active
              </div>
            </div>
            <button onClick={handleLogout} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all ml-2 outline-none">
              <LogOut size={22} />
            </button>
        </div>

        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="gradient-text text-xl">Recent Messages</h2>
          </div>
          <div className="relative flex items-center bg-white/5 rounded-xl px-4 border border-white/5 focus-within:border-indigo-500/50 transition-all">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="bg-transparent border-none p-3 text-slate-100 w-full text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {users.map((user) => (
            <div 
              key={user.uid}
              onClick={() => {
                setSelectedUser(user);
                setShowSidebar(false);
              }}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                selectedUser?.uid === user.uid ? 'bg-indigo-500/20 border-indigo-500/30' : 'hover:bg-white/5'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mr-4 border border-white/10">
                <img src={avatarIcon} alt={user.displayName} className="w-8 h-8 opacity-70" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-100">{user.displayName}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${user.online ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                  {user.online ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-20 text-slate-500 italic text-sm">No users found</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col overflow-hidden min-w-full md:min-w-0`}>
        {selectedUser ? (
          <div className="glass flex-1 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center">
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="mr-3 p-2 hover:bg-white/5 rounded-xl text-slate-400 md:hidden"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mr-3 border border-white/10 shadow-lg shadow-indigo-500/10">
                  <img src={avatarIcon} alt={selectedUser.displayName} className="w-6 h-6 opacity-70" />
                </div>
                <div>
                  <div className="font-semibold">{selectedUser.displayName}</div>
                  <div className={`text-[10px] transition-all duration-300 ${remoteTyping ? 'text-emerald-400 opacity-100' : 'text-slate-500 opacity-0'}`}>
                    {remoteTyping ? 'typing...' : ''}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.senderId === currentUser.uid ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] p-3 shadow-md text-sm leading-relaxed relative ${
                    msg.senderId === currentUser.uid 
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none' 
                      : 'bg-white/5 text-slate-200 rounded-2xl rounded-bl-none border border-white/5 backdrop-blur-sm'
                  }`}>
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="Shared" 
                        className="rounded-xl mb-2 max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    )}
                    {msg.text && <p>{msg.text}</p>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5 px-1 font-medium">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'sending...'}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-5 border-t border-white/10">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-3 bg-white/5 p-2 pr-2 pl-4 rounded-2xl border border-white/10 focus-within:border-indigo-500/30 transition-all">
                <button type="button" className="text-slate-400 hover:text-indigo-400 transition-colors"><Smile size={22} /></button>
                <button 
                type="button"
                onClick={handleImageUpload}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                title="Send Image"
              >
                <Image size={22} />
              </button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-transparent border-none flex-1 py-2 text-slate-100 outline-none placeholder:text-slate-500 text-sm"
                />
                <button 
                  type="submit" 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.03] flex items-center justify-center mb-6">
              <Send size={32} className="-rotate-45 translate-x-1" />
            </div>
            <h2 className="text-xl text-slate-200 mb-2 font-semibold">Ready to chat?</h2>
            <p className="text-sm">Select a contact from the sidebar to start a conversation</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Home;
