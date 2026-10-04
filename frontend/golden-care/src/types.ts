export type UserRole = 'admin' | 'caregiver';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  phone?: string;
  last_login?: string;
  created_at: string;
}

export interface Resident {
  id: number;
  name: string;
  ic_number: string;
  dob: string;
  gender: 'Male' | 'Female';
  emergency_contact: string;
  medical_history: string;
  room_number: string;
  created_at: string;
}

export interface Vital {
  id: number;
  resident_id: number;
  recorded_by: number;
  bp_systolic: number;
  bp_diastolic: number;
  heart_rate: number;
  temperature: number; // decimal (e.g., 37.2)
  oxygen_level: number;
  created_at: string;
  // Eager loaded relations
  resident?: Resident;
  recordedBy?: User;
}

export interface Medication {
  id: number;
  resident_id: number | null;
  name: string;
  dosage: string;
  frequency: string;
  scheduled_time: string;
  status: 'Active' | 'Discontinued';
  instructions?: string;
  created_at: string;
  resident?: Resident;
}

export interface MedicationLog {
  id: number;
  resident_id: number;
  medication_id?: number;
  medication_name?: string;
  given_by: number;
  given_at: string;
  status: 'given' | 'missed' | 'pending';
  notes?: string;
  created_at: string;
  // Eager loaded relations
  resident?: Resident;
  medication?: Medication;
  givenBy?: User;
}

export interface Visitor {
  id: number;
  resident_id: number;
  visitor_name: string;
  relationship: string;
  contact_phone: string;
  check_in: string;
  check_out?: string;
  status: 'Checked In' | 'Checked Out' | 'Scheduled';
  visit_date: string;
  created_at: string;
  resident?: Resident;
}

export interface TelegramAlertLog {
  id: string;
  resident_name: string;
  bp_systolic: number;
  bp_diastolic: number;
  temperature: number;
  caregiver_name: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'simulated';
}

export interface LaravelCodeFile {
  category: 'Migration' | 'Model' | 'Factory' | 'Seeder' | 'Controller' | 'Middleware' | 'Route' | 'View' | 'Form Request' | 'API Resource' | 'Console Command' | 'Feature Test';
  filename: string;
  path: string;
  description: string;
  code: string;
}
