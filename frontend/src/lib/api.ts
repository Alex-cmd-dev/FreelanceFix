'use client';
import { getSession } from 'next-auth/react';
import type {
  UserWithProfile, CategoryWithSubs, GigWithRelations,
  GigPackage, OrderWithRelations, Review, Message,
  Brief, BriefOffer, BriefOfferWithFreelancer, BriefWithOfferCount,
  FreelancerWithUser, Gig,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:3001/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await getSession();
  const token = (session as any)?.backendToken as string | undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

// ---------------------------------------------------------
// User Profiles
// ---------------------------------------------------------
export const getProfile = () =>
  fetchAPI<UserWithProfile>('/users/profile');

export const updateProfile = (data: {
  first_name?: string;
  last_name?: string;
  role?: 'freelancer' | 'client';
  bio?: string;
  portfolio_url?: string;
  hourly_rate?: number;
  company_name?: string;
}) =>
  fetchAPI<UserWithProfile>('/users/profile', { method: 'PUT', body: JSON.stringify(data) });

export const searchFreelancers = (params?: { query?: string; max_hourly_rate?: number }) => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  return fetchAPI<FreelancerWithUser[]>(`/freelancers${query}`);
};

// ---------------------------------------------------------
// Categories
// API returns Category[] with nested subcategories — NOT { categories, subcategories }
// ---------------------------------------------------------
export const getCategories = () =>
  fetchAPI<CategoryWithSubs[]>('/categories');

// ---------------------------------------------------------
// Gigs & Packages
// GET /gigs/:id returns a single gig object with packages nested inside
// ---------------------------------------------------------
export const getGigs = (params?: { category_id?: number; subcategory_id?: number }) => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  return fetchAPI<GigWithRelations[]>(`/gigs${query}`);
};

export const createGig = (data: {
  title: string;
  description: string;
  base_price: number;
  subcategory_id: number;
}) =>
  fetchAPI<Gig>('/gigs', { method: 'POST', body: JSON.stringify(data) });

export const deleteGig = (gigId: number) =>
  fetchAPI<{ message: string; id: number }>(`/gigs/${gigId}`, { method: 'DELETE' });

// Returns the gig directly with packages nested inside (not { gig, packages })
export const getGigDetails = (gigId: number) =>
  fetchAPI<GigWithRelations>(`/gigs/${gigId}`);

export const createGigPackage = (
  gigId: number,
  data: { tier: string; price: number; description: string; delivery_days: number },
) =>
  fetchAPI<GigPackage>(`/gigs/${gigId}/packages`, { method: 'POST', body: JSON.stringify(data) });

// ---------------------------------------------------------
// Orders & Reviews
// ---------------------------------------------------------
export const getOrders = () => fetchAPI<OrderWithRelations[]>('/orders');

export const createOrder = (gig_package_id: number) =>
  fetchAPI<OrderWithRelations>('/orders', {
    method: 'POST',
    body: JSON.stringify({ gig_package_id }),
  });

export const updateOrderStatus = (
  orderId: number,
  status: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled',
) =>
  fetchAPI<OrderWithRelations>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const postReview = (orderId: number, rating: number, comment: string) =>
  fetchAPI<Review>(`/orders/${orderId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });

// ---------------------------------------------------------
// Project Briefs & Offers
// ---------------------------------------------------------
export const getBriefs = () => fetchAPI<BriefWithOfferCount[]>('/briefs');

export const postBrief = (data: {
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
}) =>
  fetchAPI<Brief>('/briefs', { method: 'POST', body: JSON.stringify(data) });

export const getBriefOffers = (briefId: number) =>
  fetchAPI<BriefOfferWithFreelancer[]>(`/briefs/${briefId}/offers`);

export const submitBriefOffer = (
  briefId: number,
  offer_amount: number,
  description: string,
) =>
  fetchAPI<BriefOffer>(`/briefs/${briefId}/offers`, {
    method: 'POST',
    body: JSON.stringify({ offer_amount, description }),
  });

export const updateOfferStatus = (
  briefId: number,
  offerId: number,
  status: 'Accepted' | 'Rejected',
) =>
  fetchAPI<BriefOffer>(`/briefs/${briefId}/offers/${offerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ---------------------------------------------------------
// Messages
// ---------------------------------------------------------
export const getMessages = () => fetchAPI<Message[]>('/messages');

export const sendMessage = (receiver_id: string, content: string) =>
  fetchAPI<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiver_id, content }),
  });
