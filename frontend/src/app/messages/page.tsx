'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getMessages, sendMessage } from '../../lib/api';
import type { MessageWithUsers } from '../../lib/types';

interface Conversation {
  partnerId: string;
  partnerName: string;
  messages: MessageWithUsers[];
  lastMessage: MessageWithUsers;
}

function groupIntoConversations(messages: MessageWithUsers[], currentUserId: string): Conversation[] {
  const byPartner = new Map<string, MessageWithUsers[]>();

  for (const msg of messages) {
    const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
    const list = byPartner.get(partnerId) ?? [];
    list.push(msg);
    byPartner.set(partnerId, list);
  }

  const conversations: Conversation[] = Array.from(byPartner.entries()).map(([partnerId, msgs]) => {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    );
    const last = sorted[sorted.length - 1];
    const partnerObj = last.sender_id === currentUserId ? last.receiver : last.sender;
    const partnerName = partnerObj
      ? `${partnerObj.first_name} ${partnerObj.last_name}`
      : `User ${partnerId.slice(0, 6)}`;
    return { partnerId, partnerName, messages: sorted, lastMessage: last };
  });

  return conversations.sort(
    (a, b) =>
      new Date(b.lastMessage.created_at ?? 0).getTime() -
      new Date(a.lastMessage.created_at ?? 0).getTime(),
  );
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUserId) return;
    getMessages()
      .then((msgs) => {
        const convs = groupIntoConversations(msgs as MessageWithUsers[], currentUserId);
        setConversations(convs);
        setActivePartnerId((prev) => prev ?? (convs.length > 0 ? convs[0].partnerId : null));
      })
      .catch(() => setError('Failed to load messages. Is the backend running?'))
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activePartnerId, conversations]);

  const activeConv = conversations.find((c) => c.partnerId === activePartnerId) ?? null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartnerId || !currentUserId) return;
    setIsSending(true);
    try {
      const sent = await sendMessage(activePartnerId, inputText.trim()) as MessageWithUsers;
      setInputText('');
      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === activePartnerId
            ? { ...c, messages: [...c.messages, sent], lastMessage: sent }
            : c,
        ),
      );
    } catch {
      alert('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-1/3 max-w-sm border-r border-gray-200 bg-white shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Inbox</h2>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-red-500">{error}</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No messages yet.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => setActivePartnerId(conv.partnerId)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors border-l-4 ${
                  conv.partnerId === activePartnerId
                    ? 'bg-primary/5 border-l-primary'
                    : 'border-l-transparent'
                }`}
              >
                <p className="font-semibold text-gray-900 text-sm">{conv.partnerName}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage.content}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">{activeConv.partnerName}</h3>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
              {activeConv.messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`px-5 py-3 rounded-2xl max-w-md shadow-sm ${
                        isMine
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.created_at && (
                        <span
                          className={`text-xs mt-1 block ${isMine ? 'text-indigo-200 text-right' : 'text-gray-400'}`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <form className="flex space-x-3 max-w-4xl mx-auto" onSubmit={handleSend}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="bg-primary text-white rounded-full px-8 py-3 font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSending ? 'Sending…' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            {isLoading ? 'Loading…' : 'Select a conversation'}
          </div>
        )}
      </div>
    </div>
  );
}
