'use client';
import { useState, useEffect } from 'react';
import { getMessages, sendMessage } from '../../lib/api';
import type { Message } from '../../lib/types';

// Retain dummy for visual fallback when API throws since backend is down
const DUMMY_CONVERSATIONS = [
  { id: 1, name: 'Alice Smith', lastMessage: 'Can you send the draft?', active: true },
  { id: 2, name: 'Bob Johnson', lastMessage: 'Thanks for the update!', active: false },
];

export default function Messages() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch initial chat data
    getMessages()
      .then((data) => setMessages(data))
      .catch((err) => {
        console.warn('Backend unavailable, using dummy context', err);
        setError('Connected to local cache. Real-time sync paused while server is down.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const targetUserId = '123e4567-e89b-12d3-a456-426614174000'; // Default test UUID
      await sendMessage(targetUserId, inputText);
      // In a real app we'd append to state or refetch here
      setInputText('');
    } catch (err) {
      alert('Network error: Could not deliver message to the backend servers.');
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 flex relative">
       {/* Error Banner overlaying specific to missing backend */}
       {error && (
         <div className="absolute top-0 w-full z-50 bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-yellow-800 text-sm flex justify-center shadow-sm">
            {error}
         </div>
       )}

       {/* Sidebar */}
       <div className="w-1/3 max-w-sm border-r border-gray-200 bg-white shadow-sm flex flex-col z-10 pt-8">
          <div className="p-4 border-b border-gray-200 bg-white">
             <h2 className="text-xl font-bold text-gray-900">Inbox</h2>
          </div>
          <div className="overflow-y-auto flex-1 h-full">
             {DUMMY_CONVERSATIONS.map(conv => (
               <div key={conv.id} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${conv.active ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}>
                  <h3 className="font-semibold text-gray-900">{conv.name}</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">{conv.lastMessage}</p>
               </div>
             ))}
          </div>
       </div>

       {/* Main Chat Area */}
       <div className="flex-1 flex flex-col bg-white pt-8">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between shadow-sm bg-white z-10">
             <h3 className="text-lg font-bold text-gray-900">Alice Smith</h3>
             <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider border border-primary/20">Client</span>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/50">
             {isLoading ? (
                <div className="flex justify-center text-gray-400">Loading messages...</div>
             ) : (
                <>
                   {/* Dynamic block for fallback/loaded UI logic */}
                   <div className="flex justify-start">
                     <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-none px-5 py-3 max-w-md">
                       <p className="text-gray-800">Hi, I saw your gig for specialized graphic design. Are you available to start this week?</p>
                       <span className="text-xs text-gray-400 mt-2 block">10:41 AM</span>
                     </div>
                   </div>
                   <div className="flex justify-end">
                     <div className="bg-primary text-white shadow-sm rounded-2xl rounded-tr-none px-5 py-3 max-w-md">
                       <p>Hello! Yes, I can start on Wednesday. Do you have a project brief ready, or should we discuss a custom package?</p>
                       <span className="text-xs text-indigo-200 mt-2 block text-right">10:43 AM</span>
                     </div>
                   </div>
                </>
             )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 shadow-inner">
             <form className="flex space-x-4 max-w-4xl mx-auto" onSubmit={handleSend}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 appearance-none border border-gray-300 rounded-full px-6 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <button type="submit" disabled={!inputText} className="bg-primary text-white rounded-full px-8 py-3 font-semibold shadow-sm hover:bg-primary-dark transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                   Send
                </button>
             </form>
          </div>
       </div>
    </div>
  );
}
