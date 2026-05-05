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

export interface GigPackage {
  id: number;
  gig_id: number;
  tier: 'Basic' | 'Standard' | 'Premium';
  price: number;
  description: string;
  delivery_days: number;
}

export interface Gig {
  id: number;
  freelancer_id: string;
  subcategory_id: number;
  title: string;
  description: string;
  base_price: number;
  created_at?: string;
}

export interface Order {
  id: number;
  client_id: string;
  gig_package_id: number;
  status: 'Pending' | 'In_Progress' | 'Completed' | 'Cancelled';
  total_amount: number;
  due_date: string;
  created_at?: string;
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
  rating: number;
  comment?: string;
}

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at?: string;
}

export interface Brief {
  id: number;
  client_id: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  status: string;
  created_at?: string;
}

export interface BriefOffer {
  id: number;
  project_brief_id: number;
  freelancer_id: string;
  offer_amount: number;
  description: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  created_at?: string;
}

// Extended types that include nested relations from the backend

export interface FreelancerWithUser extends Freelancer {
  user?: { first_name: string; last_name: string; email?: string };
}

export interface UserWithProfile extends User {
  freelancer?: Freelancer | null;
  client?: Client | null;
}

export interface CategoryWithSubs extends Category {
  subcategories: Subcategory[];
}

export interface GigWithRelations extends Gig {
  freelancer?: FreelancerWithUser;
  subcategory?: Subcategory & { category?: Category };
  packages?: GigPackage[];
}

export interface OrderWithRelations extends Order {
  gig_package?: GigPackage & { gig?: GigWithRelations };
  payment?: Payment;
  review?: Review;
}

export interface BriefWithOfferCount extends Brief {
  _count?: { offers: number };
  client?: { user?: { first_name: string; last_name: string } };
}

export interface BriefOfferWithFreelancer extends BriefOffer {
  freelancer?: FreelancerWithUser;
}

export interface MessageWithUsers extends Message {
  sender?: { first_name: string; last_name: string };
  receiver?: { first_name: string; last_name: string };
}
