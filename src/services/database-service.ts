import { createTursoClient, TursoHttpClient } from './turso-http-client';
import { config, validateEnvironmentVariables } from '../constants/config';
import type {
  UserProfile,
  Photo,
  ProcessingJob,
  DatabaseResult,
  DatabaseError,
  PaginationOptions,
  PaginatedResult,
  PhotoFilters,
} from '../types/database';

class DatabaseService {
  private client: TursoHttpClient;

  constructor() {
    // Validate environment variables on initialization
    validateEnvironmentVariables();

    // Initialize Turso HTTP client (React Native compatible)
    this.client = createTursoClient({
      url: config.turso.url,
      authToken: config.turso.authToken,
    });
  }

  // Initialize database tables (run this once)
  async initializeTables() {
    try {
      console.log('🏗️ DatabaseService: Starting table initialization...');
      // Create users table for profile data
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          avatar_url TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create photos table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          original_url TEXT NOT NULL,
          processed_url TEXT,
          thumbnail_url TEXT,
          status TEXT NOT NULL DEFAULT 'processing',
          metadata TEXT, -- JSON string
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
        )
      `);

      // Create processing jobs table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS processing_jobs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          photo_id TEXT NOT NULL,
          type TEXT NOT NULL,
          parameters TEXT NOT NULL, -- JSON string
          status TEXT NOT NULL DEFAULT 'pending',
          progress INTEGER NOT NULL DEFAULT 0,
          error_message TEXT,
          started_at TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user_profiles(user_id),
          FOREIGN KEY (photo_id) REFERENCES photos(id)
        )
      `);

      // Create indexes for better query performance
      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id)
      `);
      
      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status)
      `);
      
      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id)
      `);
      
      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_processing_jobs_photo_id ON processing_jobs(photo_id)
      `);

      console.log('✅ DatabaseService: All tables and indexes created successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ DatabaseService: Table initialization failed:', error);
      return { success: false, error: this.handleDatabaseError(error) };
    }
  }

  // User Profile Operations
  async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<UserProfile>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO user_profiles (id, user_id, email, first_name, last_name, avatar_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          profile.id,
          profile.userId,
          profile.email,
          profile.firstName || null,
          profile.lastName || null,
          profile.avatarUrl || null,
          now,
          now,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to create user profile');
      }

      const row = result.rows[0] as any;
      const userProfile: UserProfile = {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: userProfile, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getUserProfile(userId: string): Promise<DatabaseResult<UserProfile>> {
    try {
      const result = await this.client.execute({
        sql: 'SELECT * FROM user_profiles WHERE user_id = ?',
        args: [userId],
      });

      if (result.rows.length === 0) {
        return { data: null, error: null, success: true };
      }

      const row = result.rows[0] as any;
      const userProfile: UserProfile = {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: userProfile, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'avatarUrl'>>
  ): Promise<DatabaseResult<UserProfile>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          UPDATE user_profiles 
          SET first_name = COALESCE(?, first_name),
              last_name = COALESCE(?, last_name),
              avatar_url = COALESCE(?, avatar_url),
              updated_at = ?
          WHERE user_id = ?
          RETURNING *
        `,
        args: [
          updates.firstName || null,
          updates.lastName || null,
          updates.avatarUrl || null,
          now,
          userId,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('User profile not found');
      }

      const row = result.rows[0] as any;
      const userProfile: UserProfile = {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: userProfile, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  // Photo Operations
  async createPhoto(photo: Omit<Photo, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<Photo>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO photos (id, user_id, title, description, original_url, processed_url, thumbnail_url, status, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          photo.id,
          photo.userId,
          photo.title,
          photo.description || null,
          photo.originalUrl,
          photo.processedUrl || null,
          photo.thumbnailUrl || null,
          photo.status,
          photo.metadata ? JSON.stringify(photo.metadata) : null,
          now,
          now,
        ],
      });

      const row = result.rows[0] as any;
      const photoData: Photo = {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        originalUrl: row.original_url,
        processedUrl: row.processed_url,
        thumbnailUrl: row.thumbnail_url,
        status: row.status,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: photoData, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getPhotos(
    filters: PhotoFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<Photo>>> {
    try {
      const { limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = pagination;
      const { userId, status, dateFrom, dateTo } = filters;

      let sql = 'SELECT * FROM photos WHERE 1=1';
      const args: any[] = [];

      if (userId) {
        sql += ' AND user_id = ?';
        args.push(userId);
      }

      if (status) {
        sql += ' AND status = ?';
        args.push(status);
      }

      if (dateFrom) {
        sql += ' AND created_at >= ?';
        args.push(dateFrom);
      }

      if (dateTo) {
        sql += ' AND created_at <= ?';
        args.push(dateTo);
      }

      sql += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
      sql += ' LIMIT ? OFFSET ?';
      args.push(limit + 1, offset); // Get one extra to check if there are more

      const result = await this.client.execute({ sql, args });
      
      const hasMore = result.rows.length > limit;
      const photos = result.rows.slice(0, limit).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        originalUrl: row.original_url,
        processedUrl: row.processed_url,
        thumbnailUrl: row.thumbnail_url,
        status: row.status,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const paginatedResult: PaginatedResult<Photo> = {
        data: photos,
        total: photos.length, // Note: This is not the total count, just current page count
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
      };

      return { data: paginatedResult, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getPhoto(id: string): Promise<DatabaseResult<Photo>> {
    try {
      const result = await this.client.execute({
        sql: 'SELECT * FROM photos WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) {
        return { data: null, error: null, success: true };
      }

      const row = result.rows[0] as any;
      const photo: Photo = {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        originalUrl: row.original_url,
        processedUrl: row.processed_url,
        thumbnailUrl: row.thumbnail_url,
        status: row.status,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: photo, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async updatePhoto(
    id: string,
    updates: Partial<Omit<Photo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<DatabaseResult<Photo>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          UPDATE photos 
          SET title = COALESCE(?, title),
              description = COALESCE(?, description),
              processed_url = COALESCE(?, processed_url),
              thumbnail_url = COALESCE(?, thumbnail_url),
              status = COALESCE(?, status),
              metadata = COALESCE(?, metadata),
              updated_at = ?
          WHERE id = ?
          RETURNING *
        `,
        args: [
          updates.title || null,
          updates.description || null,
          updates.processedUrl || null,
          updates.thumbnailUrl || null,
          updates.status || null,
          updates.metadata ? JSON.stringify(updates.metadata) : null,
          now,
          id,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Photo not found');
      }

      const row = result.rows[0] as any;
      const photo: Photo = {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        originalUrl: row.original_url,
        processedUrl: row.processed_url,
        thumbnailUrl: row.thumbnail_url,
        status: row.status,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: photo, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async deletePhoto(id: string): Promise<DatabaseResult<void>> {
    try {
      await this.client.execute({
        sql: 'DELETE FROM photos WHERE id = ?',
        args: [id],
      });

      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  // Processing Job Operations (similar pattern)
  async createProcessingJob(job: Omit<ProcessingJob, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<ProcessingJob>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO processing_jobs (id, user_id, photo_id, type, parameters, status, progress, error_message, started_at, completed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          job.id,
          job.userId,
          job.photoId,
          job.type,
          JSON.stringify(job.parameters),
          job.status,
          job.progress,
          job.errorMessage || null,
          job.startedAt || null,
          job.completedAt || null,
          now,
          now,
        ],
      });

      const row = result.rows[0] as any;
      const processingJob: ProcessingJob = {
        id: row.id,
        userId: row.user_id,
        photoId: row.photo_id,
        type: row.type,
        parameters: JSON.parse(row.parameters),
        status: row.status,
        progress: row.progress,
        errorMessage: row.error_message,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: processingJob, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  // Close the database connection
  close() {
    this.client.close();
  }

  // Private method to handle database errors
  private handleDatabaseError(error: any): DatabaseError {
    if (error?.message) {
      // Check for network-related errors
      if (error.message.includes('Network request failed') || 
          error.message.includes('fetch')) {
        return {
          message: 'Network error: Unable to connect to database. Please check your internet connection.',
          code: 'NETWORK_ERROR',
          details: error,
        };
      }
      
      // Check for authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return {
          message: 'Authentication error: Invalid database credentials.',
          code: 'AUTH_ERROR',
          details: error,
        };
      }
      
      // Check for Turso-specific errors
      if (error.message.includes('Turso HTTP API error')) {
        return {
          message: error.message,
          code: 'TURSO_API_ERROR',
          details: error,
        };
      }
      
      return {
        message: error.message,
        code: error.code || 'DATABASE_ERROR',
        details: error,
      };
    }
    
    return {
      message: 'An unexpected database error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;