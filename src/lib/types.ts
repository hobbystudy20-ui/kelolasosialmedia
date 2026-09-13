export interface TeamMember {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  role: string;
  status: 'Aktif' | 'Tidak Aktif';
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
  created_at: string;
}

export interface ContentScheduleItem {
  id: string;
  date: string;
  time: string;
  platform: string;
  content: string;
  city: string;
  pic: string;
  status: string;
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
  created_at: string;
}
