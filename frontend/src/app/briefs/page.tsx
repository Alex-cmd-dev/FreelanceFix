'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getBriefs, postBrief, submitBriefOffer, getBriefOffers, updateOfferStatus } from '../../lib/api';
import type { BriefWithOfferCount, BriefOfferWithFreelancer } from '../../lib/types';

export default function BriefsPage() {
  const { data: session } = useSession();

  const [briefs, setBriefs] = useState<BriefWithOfferCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create brief form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', budget_min: '', budget_max: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Offer form
  const [offerBriefId, setOfferBriefId] = useState<number | null>(null);
  const [offerForm, setOfferForm] = useState({ amount: '', description: '' });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // View offers
  const [viewingOffersBriefId, setViewingOffersBriefId] = useState<number | null>(null);
  const [offers, setOffers] = useState<BriefOfferWithFreelancer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  useEffect(() => {
    getBriefs()
      .then(setBriefs)
      .catch(() => setError('Failed to load briefs.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const brief = await postBrief({
        title: createForm.title,
        description: createForm.description,
        ...(createForm.budget_min ? { budget_min: parseFloat(createForm.budget_min) } : {}),
        ...(createForm.budget_max ? { budget_max: parseFloat(createForm.budget_max) } : {}),
      });
      setBriefs((prev) => [brief as BriefWithOfferCount, ...prev]);
      setShowCreate(false);
      setCreateForm({ title: '', description: '', budget_min: '', budget_max: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to post brief. Make sure you have a client profile.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerBriefId) return;
    setIsSubmittingOffer(true);
    try {
      await submitBriefOffer(offerBriefId, parseFloat(offerForm.amount), offerForm.description);
      setOfferBriefId(null);
      setOfferForm({ amount: '', description: '' });
      alert('Offer submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit offer.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleViewOffers = async (briefId: number) => {
    if (viewingOffersBriefId === briefId) {
      setViewingOffersBriefId(null);
      return;
    }
    setViewingOffersBriefId(briefId);
    setIsLoadingOffers(true);
    try {
      const data = await getBriefOffers(briefId);
      setOffers(data);
    } catch (err: any) {
      alert(err.message || 'Could not load offers.');
      setViewingOffersBriefId(null);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const handleOfferStatus = async (briefId: number, offerId: number, status: 'Accepted' | 'Rejected') => {
    try {
      await updateOfferStatus(briefId, offerId, status);
      setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, status } : o));
    } catch (err: any) {
      alert(err.message || 'Failed to update offer.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Project Briefs</h1>
          <p className="mt-1 text-gray-500">Open project requests from clients in the RGV</p>
        </div>
        {session && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
          >
            {showCreate ? 'Cancel' : 'Post a Brief'}
          </button>
        )}
      </div>

      {/* Create brief form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-primary/30 rounded-lg p-6 shadow-sm mb-8 space-y-4">
          <h2 className="text-base font-bold text-gray-900">New Project Brief</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input type="text" required value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. Need a logo for my dental practice"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea required rows={3} value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Describe the project, deliverables, style preferences, timeline…"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Min ($) <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="number" min="0" step="0.01" value={createForm.budget_min}
                onChange={(e) => setCreateForm({ ...createForm, budget_min: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Max ($) <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="number" min="0" step="0.01" value={createForm.budget_max}
                onChange={(e) => setCreateForm({ ...createForm, budget_max: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <button type="submit" disabled={isCreating}
            className="w-full py-2 px-4 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
            {isCreating ? 'Posting…' : 'Post Brief'}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">{error}</div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No open briefs yet</p>
          {session && <p className="text-sm mt-1">Be the first to post a project!</p>}
          {!session && <p className="text-sm mt-1"><Link href="/login" className="text-primary hover:underline">Sign in</Link> to post a brief.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => (
            <div key={brief.id} className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${brief.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {brief.status}
                    </span>
                    {brief._count?.offers != null && (
                      <span className="text-xs text-gray-400">{brief._count.offers} offer{brief._count.offers !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{brief.title}</h2>
                  {brief.client?.user && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Posted by {brief.client.user.first_name} {brief.client.user.last_name}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{brief.description}</p>
                  {(brief.budget_min || brief.budget_max) && (
                    <p className="mt-2 text-sm font-semibold text-gray-700">
                      Budget: {brief.budget_min ? `$${brief.budget_min}` : ''}
                      {brief.budget_min && brief.budget_max ? ' – ' : ''}
                      {brief.budget_max ? `$${brief.budget_max}` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Freelancer: submit offer */}
                {session && brief.status === 'Open' && (
                  <button
                    onClick={() => setOfferBriefId(offerBriefId === brief.id ? null : brief.id)}
                    className="text-xs px-3 py-1.5 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                  >
                    {offerBriefId === brief.id ? 'Cancel' : 'Submit Offer'}
                  </button>
                )}
                {/* Client: view offers on own brief */}
                {session && (
                  <button
                    onClick={() => handleViewOffers(brief.id)}
                    className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {viewingOffersBriefId === brief.id ? 'Hide Offers' : 'View Offers'}
                  </button>
                )}
              </div>

              {/* Offer submit form */}
              {offerBriefId === brief.id && (
                <form onSubmit={handleSubmitOffer} className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">Your Offer</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Offer Amount ($)</label>
                      <input type="number" required min="1" step="0.01" value={offerForm.amount}
                        onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
                        className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Description</label>
                    <textarea required rows={2} value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      placeholder="Describe your approach and why you're a great fit…"
                      className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <button type="submit" disabled={isSubmittingOffer}
                    className="text-xs px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50">
                    {isSubmittingOffer ? 'Submitting…' : 'Submit Offer'}
                  </button>
                </form>
              )}

              {/* Offers list */}
              {viewingOffersBriefId === brief.id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {isLoadingOffers ? (
                    <p className="text-sm text-gray-400">Loading offers…</p>
                  ) : offers.length === 0 ? (
                    <p className="text-sm text-gray-400">No offers yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {offers.map((offer) => (
                        <li key={offer.id} className="bg-gray-50 rounded-md p-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {offer.freelancer?.user
                                  ? `${offer.freelancer.user.first_name} ${offer.freelancer.user.last_name}`
                                  : `Freelancer #${offer.freelancer_id.slice(0, 6)}`}
                                <span className="ml-2 font-normal text-gray-500">— ${offer.offer_amount}</span>
                              </p>
                              <p className="text-gray-600 mt-1">{offer.description}</p>
                            </div>
                            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${offer.status === 'Accepted' ? 'bg-green-100 text-green-700' : offer.status === 'Rejected' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
                              {offer.status}
                            </span>
                          </div>
                          {offer.status === 'Pending' && brief.status === 'Open' && (
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => handleOfferStatus(brief.id, offer.id, 'Accepted')}
                                className="text-xs px-3 py-1 border border-green-300 text-green-600 rounded hover:bg-green-50 transition-colors">
                                Accept
                              </button>
                              <button onClick={() => handleOfferStatus(brief.id, offer.id, 'Rejected')}
                                className="text-xs px-3 py-1 border border-gray-300 text-gray-500 rounded hover:bg-gray-100 transition-colors">
                                Reject
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
