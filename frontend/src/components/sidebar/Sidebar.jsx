import React, { useState } from 'react';
import { 
  MessageSquare, Plus, Search, Edit2, Trash2, Check, X, ArrowLeft, ArrowRight, ArrowUpDown 
} from 'lucide-react';

export const Sidebar = ({ 
  conversations, 
  activeId, 
  onSelectChat, 
  onNewChat, 
  onRenameChat, 
  onDeleteChat, 
  searchTerm, 
  onSearchChange,
  page,
  totalPages,
  onPageChange,
  sortBy,
  onSortChange,
  isOpen,
  onClose
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (e, chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const saveEdit = (e, chatId) => {
    e.stopPropagation();
    if (editTitle.trim() === '') return;
    onRenameChat(chatId, editTitle.trim());
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-950 border-r border-gray-800/80 p-4 flex flex-col justify-between transform transition-transform duration-300 md:static md:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header back-drawer close */}
        <div className="flex md:hidden items-center justify-between border-b border-gray-800/80 pb-3">
          <span className="text-xs font-bold text-gray-400 font-mono">CHATS DRAWER</span>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 768) onClose();
          }}
          className="w-full py-3 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-600 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-600 outline-none transition-all"
          />
        </div>

        {/* Sorting options */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono font-semibold uppercase px-1 border-b border-gray-800/40 pb-2">
          <span className="flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sort By</span>
          </span>
          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-indigo-400 outline-none cursor-pointer border-none p-0"
          >
            <option value="latest" className="bg-gray-950">Latest First</option>
            <option value="oldest" className="bg-gray-950">Oldest First</option>
          </select>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-600">
              No conversations found
            </div>
          ) : (
            conversations.map((chat) => {
              const isEditing = editingId === chat.id;
              const isActive = activeId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectChat(chat.id);
                      if (window.innerWidth < 768) onClose();
                    }
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-gray-900/20 border-gray-800/40 hover:bg-gray-950 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-gray-950 border border-indigo-500 rounded p-1 text-xs text-white outline-none"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{chat.title}</span>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => saveEdit(e, chat.id)}
                          className="p-1 hover:text-emerald-400 text-gray-500 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 hover:text-red-400 text-gray-500 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startEdit(e, chat)}
                          className="p-1 hover:text-indigo-300 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rename Conversation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="p-1 hover:text-red-400 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination panel */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-800/80 pt-3 mt-4 text-[10px] text-gray-500 font-mono font-semibold uppercase">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg disabled:opacity-30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg disabled:opacity-30"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
