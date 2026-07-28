export type ScholarshipStatus = 'Submitted' | 'Under Review' | 'Shortlisted' | 'Accepted' | 'Waitlisted' | 'Not Selected';

export interface ScholarshipApplication {
  id: string;
  reference_number: string;
  
  // Step 1: Personal Info
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  state: string;
  occupation: string;
  
  // Step 2: Tech Background
  ai_experience: string;
  automation_experience: string;
  has_laptop: boolean;
  has_internet: boolean;
  
  // Step 3: Motivation
  motivation: string;
  goals: string;
  impact: string;
  why_you: string;
  
  // Step 4: Commitment
  commitment_confirmed: boolean;
  
  // Admin & Status
  status: ScholarshipStatus;
  admin_notes?: string | null;
  
  // Payment Status
  payment_status?: string | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  
  created_at: string;
  updated_at: string;
}

export type ScholarshipFormData = Omit<ScholarshipApplication, 'id' | 'reference_number' | 'status' | 'admin_notes' | 'created_at' | 'updated_at'>;

export interface ScholarshipOTP {
  id: string;
  email: string;
  otp_code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}
