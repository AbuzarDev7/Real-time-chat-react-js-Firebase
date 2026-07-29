import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, LogOut, Search, User, Users, Send, Image, Smile, Phone, Video, 
  MoreVertical, Loader2, Sun, Moon, Check, CheckCheck, X, MessageSquare
} from 'lucide-react';
import { auth, database } from '../firebaseconfig/firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, push, set, serverTimestamp, onDisconnect, update } from 'firebase/database';
import { useTheme } from '../context/ThemeContext';
import avatarIcon from '../assets/images/avatar_icon.png';

const EMOJI_LIST = ['😀', '😂', '😍', '🔥', '❤️', '👍', '🎉', '😊', '😎', '🙌', '💯', '✨', '👏', '🚀', '💬'];

const Home = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // 1. Auth Observer
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  // 2. Presence & Database Listeners
  useEffect(() => {
    if (!currentUser) return;

    const userStatusRef = ref(database, `users/${currentUser.uid}`);
    const connectedRef = ref(database, '.info/connected');

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        const userOnDisconnect = onDisconnect(userStatusRef);
        userOnDisconnect.update({
          online: false,
          lastSeen: serverTimestamp()
        });

        update(userStatusRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email,
          online: true,
          lastSeen: serverTimestamp()
        });
      }
    });

    // Fetch users list
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.values(data).filter(user => user.uid !== currentUser.uid);
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    });

    // Fetch all chats node for unread message counts & previews
    const chatsRef = ref(database, 'chats');
    const unsubscribeChats = onValue(chatsRef, (snapshot) => {
      setChats(snapshot.val() || {});
    });

    return () => {
      unsubscribeConnected();
      unsubscribeUsers();
      unsubscribeChats();
    };
  }, [currentUser]);

  // Calculate unread count for target user
  const getUnreadCountForUser = (targetUid) => {
    if (!currentUser || !chats) return 0;
    const chatId = currentUser.uid > targetUid 
      ? `${currentUser.uid}_${targetUid}` 
      : `${targetUid}_${currentUser.uid}`;
    const userMessages = chats[chatId]?.messages;
    if (!userMessages) return 0;
    
    return Object.values(userMessages).filter(
      (msg) => msg.senderId === targetUid && msg.read !== true
    ).length;
  };

  // Get last message text for sidebar user list item
  const getLastMessageForUser = (targetUid) => {
    if (!currentUser || !chats) return null;
    const chatId = currentUser.uid > targetUid 
      ? `${currentUser.uid}_${targetUid}` 
      : `${targetUid}_${currentUser.uid}`;
    const userMessages = chats[chatId]?.messages;
    if (!userMessages) return null;
    const msgArray = Object.values(userMessages);
    if (msgArray.length === 0) return null;
    return msgArray[msgArray.length - 1];
  };

  // Filter & Sort Users (Online Users at Top)
  const filteredAndSortedUsers = users
    .filter((user) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const nameMatch = user.displayName?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    })
    .sort((a, b) => {
      if (a.online !== b.online) {
        return a.online ? -1 : 1;
      }
      const nameA = a.displayName || '';
      const nameB = b.displayName || '';
      return nameA.localeCompare(nameB);
    });

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, remoteTyping]);

  // Fetch messages & typing indicator when active conversation changes
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

        // Auto mark unread messages as seen
        Object.entries(data).forEach(([msgId, msg]) => {
          if (msg.senderId === selectedUser.uid && msg.read !== true) {
            update(ref(database, `chats/${chatId}/messages/${msgId}`), { read: true });
          }
        });
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

  // Typing indicator debounce
  useEffect(() => {
    if (!selectedUser || !currentUser || !inputText.trim()) {
      if (isTyping && selectedUser && currentUser) {
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
    if (currentUser) {
      const userStatusRef = ref(database, `users/${currentUser.uid}`);
      await update(userStatusRef, {
        online: false,
        lastSeen: serverTimestamp()
      });
    }
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
      text: inputText.trim(),
      imageUrl: imageUrl,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      type: imageUrl ? 'image' : 'text',
      read: false
    });

    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleImageUpload = () => {
    if (window.cloudinary) {
      const myWidget = window.cloudinary.createUploadWidget(
        {
          cloudName: 'dfu6dxt8o',
          uploadPreset: 'user-img',
          theme: 'dark',
          colors: { active: '#6366f1' }
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

  const handleAddEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full bg-[#f0f2f5] dark:bg-[#0f172a] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      
      <div className="flex w-full h-full p-0 md:p-3 gap-0 md:gap-3 transition-all duration-300">
        
        {/* Sidebar Panel */}
        <div className={`w-full md:w-[360px] shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r md:border border-slate-200 dark:border-slate-800 md:rounded-2xl shadow-lg transition-transform duration-300 ${!showSidebar && selectedUser ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
          
          {/* User Profile Header */}
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <div className="w-11 h-11 rounded-full bg-indigo-600 p-0.5 mr-3 shrink-0">
                <img src={avatarIcon} alt="Profile" className="w-full h-full object-cover rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="flex-1 overflow-hidden">
                {/* Current User Name: BLACK in Light Mode, WHITE in Dark Mode */}
                <div className="font-bold text-slate-900 dark:text-white truncate text-base">
                  {currentUser?.displayName}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active Now
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={toggleTheme} 
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-all"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
              </button>

              <button 
                onClick={handleLogout} 
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/15 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-950 rounded-xl px-3 border border-slate-200 dark:border-slate-800">
              <Search size={18} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none p-2.5 text-slate-900 dark:text-slate-100 w-full text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* User Contact List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredAndSortedUsers.map((user) => {
              const unreadCount = getUnreadCountForUser(user.uid);
              const lastMsg = getLastMessageForUser(user.uid);
              const isSelected = selectedUser?.uid === user.uid;

              return (
                <div 
                  key={user.uid}
                  onClick={() => {
                    setSelectedUser(user);
                    setShowSidebar(false);
                  }}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 border-l-4 border-indigo-600' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative mr-3 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-600">
                      <img src={avatarIcon} alt={user.displayName} className="w-9 h-9 opacity-90" />
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      user.online ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                    }`}></span>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      {/* Name in HIGH CONTRAST (PURE BLACK in Light Mode, PURE WHITE in Dark Mode) */}
                      <div className="font-bold truncate text-sm text-slate-900 dark:text-white">
                        {user.displayName}
                      </div>

                      {unreadCount > 0 ? (
                        <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full shrink-0 ml-2 shadow">
                          {unreadCount}
                        </span>
                      ) : lastMsg ? (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 ml-2 font-medium">
                          {lastMsg.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-normal">
                      {lastMsg ? (
                        <span className="truncate">
                          {lastMsg.senderId === currentUser.uid ? 'You: ' : ''}{lastMsg.text || '📷 Image'}
                        </span>
                      ) : (
                        <span className="italic">{user.online ? 'Online' : 'Offline'}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAndSortedUsers.length === 0 && (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm font-medium">
                No contacts found
              </div>
            )}
          </div>
        </div>

        {/* Main Conversation Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-full md:min-w-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 md:rounded-2xl shadow-lg">
          {selectedUser ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Active Chat Header */}
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center">
                  <button 
                    onClick={() => setShowSidebar(true)}
                    className="mr-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 md:hidden"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="relative mr-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-600">
                      <img src={avatarIcon} alt={selectedUser.displayName} className="w-8 h-8 opacity-90" />
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      selectedUser.online ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                    }`}></span>
                  </div>

                  <div>
                    {/* Header Active User Name in HIGH CONTRAST (BLACK in Light Mode, WHITE in Dark Mode) */}
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedUser.displayName}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {remoteTyping ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">typing...</span>
                      ) : (
                        <span>{selectedUser.online ? 'Online' : 'Offline'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
                    <Phone size={18} />
                  </button>
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
                    <Video size={18} />
                  </button>
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-[#efeae2] dark:bg-slate-950">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUser.uid;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      
                      {/* Message Bubble */}
                      <div className={`max-w-[80%] md:max-w-[65%] p-3 shadow-sm text-sm leading-relaxed ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' 
                          : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none'
                      }`}>
                        {msg.imageUrl && (
                          <img 
                            src={msg.imageUrl} 
                            alt="Attachment" 
                            className="rounded-xl mb-2 max-h-64 w-full object-cover cursor-pointer hover:opacity-95 transition-all" 
                            onClick={() => setLightboxImage(msg.imageUrl)}
                          />
                        )}
                        {msg.text && <p className="whitespace-pre-wrap break-words font-medium">{msg.text}</p>}
                      </div>
                      
                      {/* Timestamp & Read / Seen Status */}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 px-1 font-medium flex items-center gap-1">
                        <span>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'sending...'}
                        </span>
                        {isMe && (
                          <span className={msg.read ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400'}>
                            {msg.read ? (
                              <CheckCheck size={14} className="text-indigo-600 dark:text-indigo-400 inline" />
                            ) : (
                              <Check size={14} className="inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={scrollRef} />
              </div>

              {/* Emoji Bar */}
              {showEmojiPicker && (
                <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
                  {EMOJI_LIST.map((emoji, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => handleAddEmoji(emoji)}
                      className="text-xl p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-transform active:scale-125 shrink-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="p-3 md:p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2 bg-white dark:bg-slate-950 p-2 pr-2 pl-3 rounded-xl border border-slate-300 dark:border-slate-800">
                  
                  <button 
                    type="button" 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-1.5 rounded-lg transition-colors ${showEmojiPicker ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
                    title="Choose Emoji"
                  >
                    <Smile size={20} />
                  </button>

                  <button 
                    type="button"
                    onClick={handleImageUpload}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Send Image"
                  >
                    <Image size={20} />
                  </button>

                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-transparent border-none flex-1 py-1.5 text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm font-medium"
                  />

                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg shadow transition-all active:scale-95 flex items-center justify-center shrink-0"
                    title="Send Message"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

            </div>
          ) : (
            /* Empty Chat State */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-600/10 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                <MessageSquare size={36} />
              </div>
              <h2 className="text-xl text-slate-900 dark:text-white font-bold mb-1">
                Real-Time Chat App
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs font-medium">
                Select a contact from the sidebar to start messaging.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={22} />
          </button>
          <img src={lightboxImage} alt="Full view" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

    </div>
  );
};

export default Home;
