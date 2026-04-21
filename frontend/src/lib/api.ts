import type {
  User, Freelancer, Client, Category, Subcategory, Gig, 
  GigPackage, Order, Payment, Review, Message, Brief, BriefOffer
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Standard fetch wrapper that handles auth headers and JSON parsing.
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Assuming the user token would be fetched from a client-side store or NextAuth session
  // const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    // ...options.headers,
    // ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

// ---------------------------------------------------------
// User Profiles
// ---------------------------------------------------------
export const getProfile = () => 
  fetchAPI<{ user: User, profile: Freelancer | Client }>('/users/profile');

export const updateProfile = (data: Partial<Freelancer | Client>) => 
  fetchAPI<{ message: string }>('/users/profile', { method: 'PUT', body: JSON.stringify(data) });

// ---------------------------------------------------------
// Categories
// ---------------------------------------------------------
export const getCategories = () => 
  fetchAPI<{ categories: Category[], subcategories: Subcategory[] }>('/categories');

// ---------------------------------------------------------
// Gigs & Packages
// ---------------------------------------------------------
export const getGigs = (params?: { category_id?: number; subcategory_id?: number }) => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  return fetchAPI<Gig[]>(`/gigs${query}`);
};

export const createGig = (data: { title: string; description: string; base_price: number; subcategory_id: number }) => 
  fetchAPI<Gig>('/gigs', { method: 'POST', body: JSON.stringify(data) });

export const getGigDetails = (gigId: number) => 
  fetchAPI<{ gig: Gig, packages: GigPackage[] }>(`/gigs/${gigId}`);

export const createGigPackage = (gigId: number, data: { tier: string; price: number; description: string; delivery_days: number }) => 
  fetchAPI<GigPackage>(`/gigs/${gigId}/packages`, { method: 'POST', body: JSON.stringify(data) });

// ---------------------------------------------------------
// Orders & Reviews
// ---------------------------------------------------------
export const getOrders = () => fetchAPI<Order[]>('/orders');

export const createOrder = (gig_package_id: number) => 
  fetchAPI<Order>('/orders', { method: 'POST', body: JSON.stringify({ gig_package_id }) });

export const updateOrderStatus = (orderId: number, status: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled') => 
  fetchAPI<Order>(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const postReview = (orderId: number, rating: number, comment: string) => 
  fetchAPI<Review>(`/orders/${orderId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) });

// ---------------------------------------------------------
// Project Briefs & Offers
// ---------------------------------------------------------
export const getBriefs = () => fetchAPI<Brief[]>('/briefs');

export const postBrief = (data: { title: string; description: string; budget_min?: number; budget_max?: number }) => 
  fetchAPI<Brief>('/briefs', { method: 'POST', body: JSON.stringify(data) });

export const getBriefOffers = (briefId: number) => 
  fetchAPI<BriefOffer[]>(`/briefs/${briefId}/offers`);

export const submitBriefOffer = (briefId: number, offer_amount: number, description: string) => 
  fetchAPI<BriefOffer>(`/briefs/${briefId}/offers`, { method: 'POST', body: JSON.stringify({ offer_amount, description }) });

export const updateOfferStatus = (briefId: number, offerId: number, status: 'Accepted' | 'Rejected') => 
  fetchAPI<BriefOffer>(`/briefs/${briefId}/offers/${offerId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ---------------------------------------------------------
// Messages
// ---------------------------------------------------------
export const getMessages = () => fetchAPI<Message[]>('/messages');

export const sendMessage = (receiver_id: string, content: string) => 
  fetchAPI<Message>('/messages', { method: 'POST', body: JSON.stringify({ receiver_id, content }) });
