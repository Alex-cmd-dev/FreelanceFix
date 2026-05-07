'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getMessages, sendMessage, searchFreelancers } from '../../lib/api';
import type { MessageWithUsers, FreelancerWithUser } from '../../lib/types';

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

  return Array.from(byPartner.entries())
    .map(([partnerId, msgs]) => {
      const sorted = [...msgs].sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
      );
      const last = sorted[sorted.length - 1];
      const partnerObj = last.sender_id === currentUserId ? last.receiver : last.sender;
      const partnerName = partnerObj
        ? `${partnerObj.first_name} ${partnerObj.last_name}`
        : `User ${partnerId.slice(0, 6)}`;
      return { partnerId, partnerName, messages: sorted, lastMessage: last };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessage.created_at ?? 0).getTime() -
        new Date(a.lastMessage.created_at ?? 0).getTime(),
    );
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentUserId = (session?.user as any)?.id as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [pendingPartner, setPendingPartner] = useState<{ id: string; name: string } | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // New message compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [freelancers, setFreelancers] = useState<FreelancerWithUser[]>([]);
  const [freelancerSearch, setFreelancerSearch] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

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

  const openCompose = () => {
    setComposeOpen(true);
    if (freelancers.length === 0) {
      searchFreelancers().then(setFreelancers).catch(() => {});
    }
  };

  const selectPartner = (f: FreelancerWithUser) => {
    const name = f.user
      ? `${f.user.first_name} ${f.user.last_name}`
      : `User ${f.id.slice(0, 6)}`;
    const existing = conversations.find((c) => c.partnerId === f.id);
    if (existing) {
      setActivePartnerId(f.id);
      setPendingPartner(null);
    } else {
      setActivePartnerId(f.id);
      setPendingPartner({ id: f.id, name });
    }
    setComposeOpen(false);
    setFreelancerSearch('');
  };

  const activeConv = conversations.find((c) => c.partnerId === activePartnerId) ?? null;
  const activeName = activeConv?.partnerName ?? pendingPartner?.name ?? null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartnerId || !currentUserId) return;
    setIsSending(true);
    try {
      const sent = (await sendMessage(activePartnerId, inputText.trim())) as MessageWithUsers;
      setInputText('');
      if (!activeConv) {
        const newConv: Conversation = {
          partnerId: activePartnerId,
          partnerName: pendingPartner?.name ?? activePartnerId,
          messages: [sent],
          lastMessage: sent,
        };
        setConversations((prev) => [newConv, ...prev]);
        setPendingPartner(null);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === activePartnerId
              ? { ...c, messages: [...c.messages, sent], lastMessage: sent }
              : c,
          ),
        );
      }
    } catch {
      alert('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredFreelancers = freelancerSearch
    ? freelancers.filter((f) => {
        const name = `${f.user?.first_name ?? ''} ${f.user?.last_name ?? ''}`.toLowerCase();
        return name.includes(freelancerSearch.toLowerCase());
      })
    : freelancers;

  if (status === 'loading') {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-1/3 max-w-sm border-r border-gray-200 bg-white shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Inbox</h2>
          <button
            onClick={openCompose}
            className="text-xs font-semibold text-primary border border-primary/30 px-2.5 py-1 rounded-md hover:bg-primary/5 transition-colors"
          >
            + New
          </button>
        </div>

        {/* Compose panel */}
        {composeOpen && (
          <div className="border-b border-gray-200 p-3 bg-gray-50">
            <input
              type="text"
              autoFocus
              placeholder="Search freelancers…"
              value={freelancerSearch}
              onChange={(e) => setFreelancerSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            />
            <ul className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
              {filteredFreelancers.length === 0 ? (
                <li className="text-xs text-gray-400 px-2 py-1">No freelancers found</li>
              ) : (
                filteredFreelancers
                  .filter((f) => f.id !== currentUserId)
                  .map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => selectPartner(f)}
                        className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-white hover:shadow-sm transition-colors"
                      >
                        {f.user
                          ? `${f.user.first_name} ${f.user.last_name}`
                          : `User ${f.id.slice(0, 6)}`}
                      </button>
                    </li>
                  ))
              )}
            </ul>
            <button
              onClick={() => { setComposeOpen(false); setFreelancerSearch(''); }}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

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
          ) : conversations.length === 0 && !pendingPartner ? (
            <p className="p-4 text-sm text-gray-400">No messages yet. Start one with + New.</p>
          ) : (
            <>
              {pendingPartner && !conversations.find((c) => c.partnerId === pendingPartner.id) && (
                <button
                  onClick={() => setActivePartnerId(pendingPartner.id)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors border-l-4 ${activePartnerId === pendingPartner.id ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}
                >
                  <p className="font-semibold text-gray-900 text-sm">{pendingPartner.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 italic">New conversation</p>
                </button>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => { setActivePartnerId(conv.partnerId); setPendingPartner(null); }}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors border-l-4 ${conv.partnerId === activePartnerId ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}
                >
                  <p className="font-semibold text-gray-900 text-sm">{conv.partnerName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage.content}</p>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeName ? (
          <>
            <div className="p-4 border-b border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">{activeName}</h3>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
              {(activeConv?.messages ?? []).map((msg) => {
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
                        <span className={`text-xs mt-1 block ${isMine ? 'text-indigo-200 text-right' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {!activeConv && pendingPartner && (
                <p className="text-center text-sm text-gray-400">
                  Start the conversation with {pendingPartner.name}
                </p>
              )}
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
            {isLoading ? 'Loading…' : 'Select a conversation or start a new one'}
          </div>
        )}
      </div>
    </div>
  );
}
