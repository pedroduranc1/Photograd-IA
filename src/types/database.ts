// Database types for Turso LibSQL

// User profile stored in Turso
export interface UserProfile {
  id: string;
  userId: string; // Supabase user ID
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Example entity - replace with your actual data models
export interface Photo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  originalUrl: string;
  processedUrl?: string;
  thumbnailUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Processing job for photos
export interface ProcessingJob {
  id: string;
  userId: string;
  photoId: string;
  type: 'enhance' | 'filter' | 'resize' | 'format_conversion';
  parameters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Generic database result type
export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
  success: boolean;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: any;
}

// Pagination types
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Query filters
export interface PhotoFilters {
  userId?: string;
  status?: Photo['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface ProcessingJobFilters {
  userId?: string;
  photoId?: string;
  type?: ProcessingJob['type'];
  status?: ProcessingJob['status'];
}

// School Management System Types

export interface School {
  id: string;
  userId: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  debtAmount: number;
  nextGraduation?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields (not in database)
  studentCount?: number;
  gradeCount?: number;
  location?: string; // Derived from address
}

export interface Grade {
  id: string;
  schoolId: string;
  name: string;
  level: string;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  studentCount?: number;
}

export interface Student {
  id: string;
  schoolId: string;
  gradeId: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentDate: string;
  graduationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  fullName?: string;
  age?: number;
  photoCount?: number;
  paymentCount?: number;
  totalDebt?: number;
  // Relations
  school?: School;
  grade?: Grade;
}

export interface StudentPhoto {
  id: string;
  studentId: string;
  photoUrl: string;
  photoType: 'profile' | 'graduation' | 'event' | 'id_card' | 'other';
  takenDate: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Relations
  student?: Student;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentType: 'tuition' | 'registration' | 'materials' | 'events' | 'other';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
  paymentDate: string;
  dueDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  student?: Student;
}

// School Management Filters
export interface SchoolFilters {
  userId?: string;
  status?: School['status'];
  search?: string; // For name, address search
}

export interface GradeFilters {
  schoolId?: string;
  level?: string;
  academicYear?: string;
  search?: string; // For name search
}

export interface StudentFilters {
  schoolId?: string;
  gradeId?: string;
  status?: Student['status'];
  search?: string; // For name, student ID search
  gender?: Student['gender'];
  enrollmentYear?: string;
}

export interface PaymentFilters {
  studentId?: string;
  schoolId?: string;
  gradeId?: string;
  paymentType?: Payment['paymentType'];
  status?: Payment['status'];
  paymentMethod?: Payment['paymentMethod'];
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentPhotoFilters {
  studentId?: string;
  photoType?: StudentPhoto['photoType'];
  dateFrom?: string;
  dateTo?: string;
}

// Extended result types with statistics
export interface SchoolWithStats extends School {
  studentCount: number;
  gradeCount: number;
  totalDebt: number;
  activeStudents: number;
}

export interface GradeWithStats extends Grade {
  studentCount: number;
  activeStudents: number;
}

export interface StudentWithDetails extends Student {
  fullName: string;
  age?: number;
  photoCount: number;
  paymentCount: number;
  totalDebt: number;
  school: School;
  grade: Grade;
  recentPhotos?: StudentPhoto[];
  recentPayments?: Payment[];
}