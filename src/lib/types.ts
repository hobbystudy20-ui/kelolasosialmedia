export interface TeamMember {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  role: string;
  status: 'Aktif' | 'Tidak Aktif';
  photo: string;
  education_background: string;
  services_can_handle: string;
  team_notes: string;
  archived: boolean;
  created_at: string;
}

export interface ContentPlannerItem {
  id: string;
  date: string;
  platform: string;
  city: string;
  theme: string;
  content_type: string;
  pic: string;
  status: string;
  notes: string;
  topic: string;
  content_pillar: string;
  caption: string;
  cta: string;
  hashtags: string;
  target_audience: string;
  team_member_id: string | null;
  archived: boolean;
  created_at: string;
}

export interface ContentScheduleItem {
  id: string;
  date: string;
  time: string;
  platform: string;
  content: string;
  content_title: string;
  city: string;
  pic: string;
  status: string;
  team_member_id: string | null;
  archived: boolean;
  reference: string;
  notes: string;
  created_at: string;
}

export interface Caption {
  id: string;
  title: string;
  platform: string;
  category: string;
  content: string;
  keywords: string;
  cta: string;
  hashtags: string;
  archived: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_id_code: string;
  customer_name: string;
  whatsapp: string;
  service_type: string;
  date: string;
  time: string;
  start_time: string;
  end_time: string;
  pickup_location: string;
  destination: string;
  city: string;
  notes: string;
  user_notes: string;
  internal_notes: string;
  status: string;
  payment_status: string;
  payment_method: string;
  user_id: string | null;
  team_member_id: string | null;
  service_id: string | null;
  service_fee: number;
  transport_fee: number;
  additional_fee: number;
  discount: number;
  total_amount: number;
  dp_amount: number;
  paid_amount: number;
  remaining_balance: number;
  archived: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  patient_name: string;
  patient_contact: string;
  address: string;
  city: string;
  notes: string;
  status: string;
  total_transactions: number;
  archived: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  price_unit: string;
  duration: string;
  status: string;
  notes: string;
  archived: boolean;
  created_at: string;
}

export interface ServiceArea {
  id: string;
  city: string;
  district: string;
  status: string;
  notes: string;
  created_at: string;
}

export interface Revenue {
  id: string;
  transaction_id: string;
  date: string;
  booking_id: string | null;
  user_id: string | null;
  service: string;
  service_fee: number;
  transport_fee: number;
  additional_fee: number;
  discount: number;
  total: number;
  payment_status: string;
  payment_method: string;
  notes: string;
  created_at: string;
}

export interface OperationalExpense {
  id: string;
  expense_id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  person: string;
  booking_id: string | null;
  receipt: string;
  notes: string;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_id: string;
  booking_id: string | null;
  user_id: string | null;
  total_bill: number;
  dp_amount: number;
  paid_amount: number;
  remaining_balance: number;
  payment_status: string;
  payment_date: string;
  payment_method: string;
  notes: string;
  created_at: string;
}

export interface Transportation {
  id: string;
  transport_id: string;
  booking_id: string | null;
  user_id: string | null;
  team_member_id: string | null;
  date: string;
  transport_type: string;
  origin: string;
  destination: string;
  cost: number;
  notes: string;
  created_at: string;
}

export interface Inventory {
  id: string;
  item_id: string;
  item: string;
  category: string;
  quantity: number;
  condition: string;
  location: string;
  responsible_person: string;
  purchase_date: string;
  purchase_price: number;
  notes: string;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  version: string;
  upload_date: string;
  updated_date: string;
  description: string;
  file_url: string;
  status: string;
  archived: boolean;
  created_at: string;
}

export interface SosmedMetric {
  id: string;
  date: string;
  platform: string;
  content_title: string;
  content_type: string;
  followers: number;
  followers_growth: number;
  reach: number;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profile_visits: number;
  link_clicks: number;
  dm_inquiries: number;
  service_inquiries: number;
  bookings_generated: number;
  notes: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  feedback_id: string;
  booking_id: string | null;
  user_id: string | null;
  user_name: string;
  service: string;
  team_member_id: string | null;
  team_member_name: string;
  rating: number;
  what_went_well: string;
  what_could_improve: string;
  suggestion: string;
  complaint: string;
  feedback_type: string;
  date: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  time: string;
  actor: string;
  activity: string;
  module: string;
  related_id: string | null;
  created_at: string;
}
