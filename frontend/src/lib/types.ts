// Generated automatically from openapi.yaml mappings

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Freelancer {
  id: string;
  bio?: string;
  portfolio_url?: string;
  hourly_rate?: number;
  created_at: string;
}

export interface Client {
  id: string;
  company_name?: string;
  spending_history?: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  description?: string;
}

export interface Gig {
  id: number;
  freelancer_id: string;
  subcategory_id: number;
  title: string;
  description: string;
  base_price: number;
}

export interface GigPackage {
  id: number;
  gig_id: number;
  tier: 'Basic' | 'Standard' | 'Premium';
  price: number;
  description: string;
  delivery_days: number;
}

export interface Order {
  id: number;
  client_id: string;
  gig_package_id: number;
  status: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled';
  total_amount: number;
  due_date: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  status: 'Pending' | 'Escrow' | 'Released' | 'Refunded';
  payment_method?: string;
}

export interface Review {
  id: number;
  order_id: number;
  rating: number; // 1-5
  comment?: string;
}

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
}

export interface Brief {
  id: number;
  client_id: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  status: string;
}

export interface BriefOffer {
  id: number;
  project_brief_id: number;
  freelancer_id: string;
  offer_amount: number;
  description: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}
