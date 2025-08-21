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