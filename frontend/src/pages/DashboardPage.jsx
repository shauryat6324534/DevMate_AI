import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWorkspace from '../components/chat/ChatWorkspace';
import ResultPanel from '../components/results/ResultPanel';

export const DashboardPage = ({ token, user, theme, toggleTheme, onLogout }) => {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  
  // Sidebar Search & Sorting & Paging states
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('latest');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Highlighting code analysis state
  const [selectedCode, setSelectedCode] = useState(null);

  // Fetch conversations list
  const fetchConversations = async () => {
    setSidebarLoading(true);
    try {
      let endpoint = `http://localhost:5000/api/chats?page=${page}&limit=10&sortBy=${sortBy}`;
      if (searchTerm.trim() !== '') {
        endpoint = `http://localhost:5000/api/chats/search?q=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        if (searchTerm.trim() !== '') {
          // Search returns raw array of conversations
          setConversations(resJson.data || []);
          setTotalPages(1);
        } else {
          // List returns paginated data structure
          setConversations(resJson.data.conversations || []);
          setTotalPages(resJson.data.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setSidebarLoading(false);
    }
  };

  // Fetch messages thread for selected conversation
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setMessages(resJson.data.messages || []);
      } else {
        throw new Error(resJson.error || 'Failed to retrieve messages');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [page, sortBy, token]);

  // Handle typing search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchConversations();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSelectChat = (chatId) => {
    setActiveId(chatId);
    setSelectedCode(null); // Clear selected code analysis
    fetchMessages(chatId);
  };

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setSelectedCode(null);
    setError(null);
  };

  const handleSendPrompt = async () => {
    if (prompt.trim() === '') return;
    setLoading(true);
    setError(null);

    const userPrompt = prompt.trim();
    setPrompt('');

    // Optimistically insert user prompt bubble
    const tempUserMsg = { id: Date.now(), sender: 'user', content: userPrompt };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // Call Learning Assistant API endpoint to act as conversational programming tutor
      const response = await fetch('http://localhost:5000/api/learning-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: userPrompt,
          conversationId: activeId
        })
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to generate response');
      }

      const activeConvId = resJson.data.conversationId;
      
      // Update active ID if a new conversation thread was created
      if (!activeId) {
        setActiveId(activeConvId);
        fetchConversations();
      }

      // Reload messages list from database tables to keep UI sync clean
      await fetchMessages(activeConvId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameChat = async (chatId, title) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chats/${chatId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        fetchConversations();
      }
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        if (activeId === chatId) {
          handleNewChat();
        }
        fetchConversations();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#090d16] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Navbar header */}
      <Navbar 
        user={user} 
        token={token} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onLogout={onLogout} 
      />

      {/* Main Grid splits */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Overlay backdrop for mobile drawer */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          ></div>
        )}

        <ChatWorkspace
          messages={messages}
          loading={loading}
          error={error}
          prompt={prompt}
          onPromptChange={setPrompt}
          onSend={handleSendPrompt}
          onSelectCode={setSelectedCode}
          onOpenSidebar={() => setSidebarOpen(true)}
          selectedCodeText={selectedCode}
        />

        <ResultPanel 
          code={selectedCode} 
          token={token} 
        />
      </div>
    </div>
  );
};

export default DashboardPage;
