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
  School,
  Grade,
  Student,
  Payment,
  StudentPhoto,
  SchoolFilters,
  GradeFilters,
  StudentFilters,
  PaymentFilters,
  StudentPhotoFilters,
  SchoolWithStats,
  GradeWithStats,
  StudentWithDetails,
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

      // Create schools table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS schools (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          debt_amount REAL NOT NULL DEFAULT 0,
          next_graduation TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
        )
      `);

      // Create grades table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS grades (
          id TEXT PRIMARY KEY,
          school_id TEXT NOT NULL,
          name TEXT NOT NULL,
          level TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
      `);

      // Create students table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          school_id TEXT NOT NULL,
          grade_id TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          student_id TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          birth_date TEXT,
          gender TEXT,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          enrollment_date TEXT NOT NULL,
          graduation_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
          FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
          UNIQUE(school_id, student_id)
        )
      `);

      // Create student_photos table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS student_photos (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          photo_url TEXT NOT NULL,
          photo_type TEXT NOT NULL DEFAULT 'profile',
          taken_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
      `);

      // Create payments table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          amount REAL NOT NULL,
          payment_type TEXT NOT NULL,
          payment_method TEXT NOT NULL DEFAULT 'cash',
          payment_date TEXT NOT NULL,
          due_date TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          description TEXT,
          reference_number TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
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

      // School management indexes
      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_schools_user_id ON schools(user_id)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_grades_school_id ON grades(school_id)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_students_grade_id ON students(grade_id)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_student_photos_student_id ON student_photos(student_id)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)
      `);

      await this.client.execute(`
        CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date)
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

  // === SCHOOL MANAGEMENT OPERATIONS ===

  // School Operations
  async createSchool(school: Omit<School, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<School>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO schools (id, user_id, name, address, phone, email, status, debt_amount, next_graduation, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          school.id,
          school.userId,
          school.name,
          school.address,
          school.phone || null,
          school.email || null,
          school.status,
          school.debtAmount,
          school.nextGraduation || null,
          now,
          now,
        ],
      });

      const row = result.rows[0] as any;
      const schoolData: School = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        email: row.email,
        status: row.status,
        debtAmount: row.debt_amount,
        nextGraduation: row.next_graduation,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: schoolData, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getSchools(
    filters: SchoolFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<SchoolWithStats>>> {
    try {
      const { limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = pagination;
      const { userId, status, search } = filters;

      let sql = `
        SELECT 
          s.*,
          COUNT(DISTINCT st.id) as student_count,
          COUNT(DISTINCT g.id) as grade_count,
          COUNT(DISTINCT CASE WHEN st.status = 'active' THEN st.id END) as active_students,
          COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'overdue' THEN p.amount ELSE 0 END), 0) as total_debt
        FROM schools s
        LEFT JOIN grades g ON s.id = g.school_id
        LEFT JOIN students st ON s.id = st.school_id
        LEFT JOIN payments p ON st.id = p.student_id
        WHERE 1=1
      `;
      const args: any[] = [];

      if (userId) {
        sql += ' AND s.user_id = ?';
        args.push(userId);
      }

      if (status) {
        sql += ' AND s.status = ?';
        args.push(status);
      }

      if (search) {
        sql += ' AND (s.name LIKE ? OR s.address LIKE ?)';
        args.push(`%${search}%`, `%${search}%`);
      }

      sql += ` GROUP BY s.id ORDER BY s.${orderBy} ${orderDirection.toUpperCase()}`;
      sql += ' LIMIT ? OFFSET ?';
      args.push(limit + 1, offset);

      const result = await this.client.execute({ sql, args });
      
      const hasMore = result.rows.length > limit;
      const schools = result.rows.slice(0, limit).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        email: row.email,
        status: row.status,
        debtAmount: row.debt_amount,
        nextGraduation: row.next_graduation,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        studentCount: row.student_count,
        gradeCount: row.grade_count,
        activeStudents: row.active_students,
        totalDebt: row.total_debt,
      }));

      const paginatedResult: PaginatedResult<SchoolWithStats> = {
        data: schools,
        total: schools.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
      };

      return { data: paginatedResult, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getSchool(id: string): Promise<DatabaseResult<SchoolWithStats>> {
    try {
      const result = await this.client.execute({
        sql: `
          SELECT 
            s.*,
            COUNT(DISTINCT st.id) as student_count,
            COUNT(DISTINCT g.id) as grade_count,
            COUNT(DISTINCT CASE WHEN st.status = 'active' THEN st.id END) as active_students,
            COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'overdue' THEN p.amount ELSE 0 END), 0) as total_debt
          FROM schools s
          LEFT JOIN grades g ON s.id = g.school_id
          LEFT JOIN students st ON s.id = st.school_id
          LEFT JOIN payments p ON st.id = p.student_id
          WHERE s.id = ?
          GROUP BY s.id
        `,
        args: [id],
      });

      if (result.rows.length === 0) {
        return { data: null, error: null, success: true };
      }

      const row = result.rows[0] as any;
      const school: SchoolWithStats = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        email: row.email,
        status: row.status,
        debtAmount: row.debt_amount,
        nextGraduation: row.next_graduation,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        studentCount: row.student_count,
        gradeCount: row.grade_count,
        activeStudents: row.active_students,
        totalDebt: row.total_debt,
      };

      return { data: school, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async updateSchool(
    id: string,
    updates: Partial<Omit<School, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<DatabaseResult<School>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          UPDATE schools 
          SET name = COALESCE(?, name),
              address = COALESCE(?, address),
              phone = COALESCE(?, phone),
              email = COALESCE(?, email),
              status = COALESCE(?, status),
              debt_amount = COALESCE(?, debt_amount),
              next_graduation = COALESCE(?, next_graduation),
              updated_at = ?
          WHERE id = ?
          RETURNING *
        `,
        args: [
          updates.name || null,
          updates.address || null,
          updates.phone || null,
          updates.email || null,
          updates.status || null,
          updates.debtAmount !== undefined ? updates.debtAmount : null,
          updates.nextGraduation || null,
          now,
          id,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('School not found');
      }

      const row = result.rows[0] as any;
      const school: School = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        email: row.email,
        status: row.status,
        debtAmount: row.debt_amount,
        nextGraduation: row.next_graduation,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: school, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async deleteSchool(id: string): Promise<DatabaseResult<void>> {
    try {
      await this.client.execute({
        sql: 'DELETE FROM schools WHERE id = ?',
        args: [id],
      });

      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  // Grade Operations
  async createGrade(grade: Omit<Grade, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<Grade>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO grades (id, school_id, name, level, academic_year, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          grade.id,
          grade.schoolId,
          grade.name,
          grade.level,
          grade.academicYear,
          now,
          now,
        ],
      });

      const row = result.rows[0] as any;
      const gradeData: Grade = {
        id: row.id,
        schoolId: row.school_id,
        name: row.name,
        level: row.level,
        academicYear: row.academic_year,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: gradeData, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getGrades(
    filters: GradeFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<GradeWithStats>>> {
    try {
      const { limit = 20, offset = 0, orderBy = 'name', orderDirection = 'asc' } = pagination;
      const { schoolId, level, academicYear, search } = filters;

      let sql = `
        SELECT 
          g.*,
          COUNT(s.id) as student_count,
          COUNT(CASE WHEN s.status = 'active' THEN s.id END) as active_students
        FROM grades g
        LEFT JOIN students s ON g.id = s.grade_id
        WHERE 1=1
      `;
      const args: any[] = [];

      if (schoolId) {
        sql += ' AND g.school_id = ?';
        args.push(schoolId);
      }

      if (level) {
        sql += ' AND g.level = ?';
        args.push(level);
      }

      if (academicYear) {
        sql += ' AND g.academic_year = ?';
        args.push(academicYear);
      }

      if (search) {
        sql += ' AND g.name LIKE ?';
        args.push(`%${search}%`);
      }

      sql += ` GROUP BY g.id ORDER BY g.${orderBy} ${orderDirection.toUpperCase()}`;
      sql += ' LIMIT ? OFFSET ?';
      args.push(limit + 1, offset);

      const result = await this.client.execute({ sql, args });
      
      const hasMore = result.rows.length > limit;
      const grades = result.rows.slice(0, limit).map((row: any) => ({
        id: row.id,
        schoolId: row.school_id,
        name: row.name,
        level: row.level,
        academicYear: row.academic_year,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        studentCount: row.student_count,
        activeStudents: row.active_students,
      }));

      const paginatedResult: PaginatedResult<GradeWithStats> = {
        data: grades,
        total: grades.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
      };

      return { data: paginatedResult, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getGrade(id: string): Promise<DatabaseResult<GradeWithStats>> {
    try {
      const result = await this.client.execute({
        sql: `
          SELECT 
            g.*,
            COUNT(s.id) as student_count,
            COUNT(CASE WHEN s.status = 'active' THEN s.id END) as active_students
          FROM grades g
          LEFT JOIN students s ON g.id = s.grade_id
          WHERE g.id = ?
          GROUP BY g.id
        `,
        args: [id],
      });

      if (result.rows.length === 0) {
        return { data: null, error: null, success: true };
      }

      const row = result.rows[0] as any;
      const grade: GradeWithStats = {
        id: row.id,
        schoolId: row.school_id,
        name: row.name,
        level: row.level,
        academicYear: row.academic_year,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        studentCount: row.student_count,
        activeStudents: row.active_students,
      };

      return { data: grade, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async updateGrade(
    id: string,
    updates: Partial<Omit<Grade, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>
  ): Promise<DatabaseResult<Grade>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          UPDATE grades 
          SET name = COALESCE(?, name),
              level = COALESCE(?, level),
              academic_year = COALESCE(?, academic_year),
              updated_at = ?
          WHERE id = ?
          RETURNING *
        `,
        args: [
          updates.name || null,
          updates.level || null,
          updates.academicYear || null,
          now,
          id,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Grade not found');
      }

      const row = result.rows[0] as any;
      const grade: Grade = {
        id: row.id,
        schoolId: row.school_id,
        name: row.name,
        level: row.level,
        academicYear: row.academic_year,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: grade, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async deleteGrade(id: string): Promise<DatabaseResult<void>> {
    try {
      await this.client.execute({
        sql: 'DELETE FROM grades WHERE id = ?',
        args: [id],
      });

      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  // Student Operations
  async createStudent(student: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<Student>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO students (
            id, school_id, grade_id, first_name, last_name, student_id, email, phone, address,
            birth_date, gender, emergency_contact_name, emergency_contact_phone, status,
            enrollment_date, graduation_date, notes, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          student.id,
          student.schoolId,
          student.gradeId,
          student.firstName,
          student.lastName,
          student.studentId,
          student.email || null,
          student.phone || null,
          student.address || null,
          student.birthDate || null,
          student.gender || null,
          student.emergencyContactName || null,
          student.emergencyContactPhone || null,
          student.status,
          student.enrollmentDate,
          student.graduationDate || null,
          student.notes || null,
          now,
          now,
        ],
      });

      const row = result.rows[0] as any;
      const studentData: Student = {
        id: row.id,
        schoolId: row.school_id,
        gradeId: row.grade_id,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        email: row.email,
        phone: row.phone,
        address: row.address,
        birthDate: row.birth_date,
        gender: row.gender,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        status: row.status,
        enrollmentDate: row.enrollment_date,
        graduationDate: row.graduation_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: studentData, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getStudents(
    filters: StudentFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<StudentWithDetails>>> {
    try {
      const { limit = 20, offset = 0, orderBy = 'last_name', orderDirection = 'asc' } = pagination;
      const { schoolId, gradeId, status, search, gender, enrollmentYear } = filters;

      let sql = `
        SELECT 
          s.*,
          sc.name as school_name,
          sc.address as school_address,
          g.name as grade_name,
          g.level as grade_level,
          COUNT(DISTINCT sp.id) as photo_count,
          COUNT(DISTINCT p.id) as payment_count,
          COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'overdue' THEN p.amount ELSE 0 END), 0) as total_debt
        FROM students s
        LEFT JOIN schools sc ON s.school_id = sc.id
        LEFT JOIN grades g ON s.grade_id = g.id
        LEFT JOIN student_photos sp ON s.id = sp.student_id
        LEFT JOIN payments p ON s.id = p.student_id
        WHERE 1=1
      `;
      const args: any[] = [];

      if (schoolId) {
        sql += ' AND s.school_id = ?';
        args.push(schoolId);
      }

      if (gradeId) {
        sql += ' AND s.grade_id = ?';
        args.push(gradeId);
      }

      if (status) {
        sql += ' AND s.status = ?';
        args.push(status);
      }

      if (gender) {
        sql += ' AND s.gender = ?';
        args.push(gender);
      }

      if (enrollmentYear) {
        sql += ' AND strftime("%Y", s.enrollment_date) = ?';
        args.push(enrollmentYear);
      }

      if (search) {
        sql += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)';
        args.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      sql += ` GROUP BY s.id ORDER BY s.${orderBy} ${orderDirection.toUpperCase()}`;
      sql += ' LIMIT ? OFFSET ?';
      args.push(limit + 1, offset);

      const result = await this.client.execute({ sql, args });
      
      const hasMore = result.rows.length > limit;
      const students = result.rows.slice(0, limit).map((row: any) => ({
        id: row.id,
        schoolId: row.school_id,
        gradeId: row.grade_id,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        email: row.email,
        phone: row.phone,
        address: row.address,
        birthDate: row.birth_date,
        gender: row.gender,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        status: row.status,
        enrollmentDate: row.enrollment_date,
        graduationDate: row.graduation_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        fullName: `${row.first_name} ${row.last_name}`,
        photoCount: row.photo_count,
        paymentCount: row.payment_count,
        totalDebt: row.total_debt,
        school: {
          id: row.school_id,
          name: row.school_name,
          address: row.school_address,
        },
        grade: {
          id: row.grade_id,
          name: row.grade_name,
          level: row.grade_level,
        },
      }));

      const paginatedResult: PaginatedResult<StudentWithDetails> = {
        data: students,
        total: students.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
      };

      return { data: paginatedResult, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getStudent(id: string): Promise<DatabaseResult<StudentWithDetails>> {
    try {
      const result = await this.client.execute({
        sql: `
          SELECT 
            s.*,
            sc.name as school_name,
            sc.address as school_address,
            sc.phone as school_phone,
            sc.email as school_email,
            g.name as grade_name,
            g.level as grade_level,
            g.academic_year as grade_academic_year,
            COUNT(DISTINCT sp.id) as photo_count,
            COUNT(DISTINCT p.id) as payment_count,
            COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'overdue' THEN p.amount ELSE 0 END), 0) as total_debt
          FROM students s
          LEFT JOIN schools sc ON s.school_id = sc.id
          LEFT JOIN grades g ON s.grade_id = g.id
          LEFT JOIN student_photos sp ON s.id = sp.student_id
          LEFT JOIN payments p ON s.id = p.student_id
          WHERE s.id = ?
          GROUP BY s.id
        `,
        args: [id],
      });

      if (result.rows.length === 0) {
        return { data: null, error: null, success: true };
      }

      const row = result.rows[0] as any;
      const student: StudentWithDetails = {
        id: row.id,
        schoolId: row.school_id,
        gradeId: row.grade_id,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        email: row.email,
        phone: row.phone,
        address: row.address,
        birthDate: row.birth_date,
        gender: row.gender,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        status: row.status,
        enrollmentDate: row.enrollment_date,
        graduationDate: row.graduation_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        fullName: `${row.first_name} ${row.last_name}`,
        photoCount: row.photo_count,
        paymentCount: row.payment_count,
        totalDebt: row.total_debt,
        school: {
          id: row.school_id,
          userId: '',
          name: row.school_name,
          address: row.school_address,
          phone: row.school_phone,
          email: row.school_email,
          status: 'active',
          debtAmount: 0,
          createdAt: '',
          updatedAt: '',
        },
        grade: {
          id: row.grade_id,
          schoolId: row.school_id,
          name: row.grade_name,
          level: row.grade_level,
          academicYear: row.grade_academic_year,
          createdAt: '',
          updatedAt: '',
        },
      };

      return { data: student, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async updateStudent(
    id: string,
    updates: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DatabaseResult<Student>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          UPDATE students 
          SET school_id = COALESCE(?, school_id),
              grade_id = COALESCE(?, grade_id),
              first_name = COALESCE(?, first_name),
              last_name = COALESCE(?, last_name),
              student_id = COALESCE(?, student_id),
              email = COALESCE(?, email),
              phone = COALESCE(?, phone),
              address = COALESCE(?, address),
              birth_date = COALESCE(?, birth_date),
              gender = COALESCE(?, gender),
              emergency_contact_name = COALESCE(?, emergency_contact_name),
              emergency_contact_phone = COALESCE(?, emergency_contact_phone),
              status = COALESCE(?, status),
              enrollment_date = COALESCE(?, enrollment_date),
              graduation_date = COALESCE(?, graduation_date),
              notes = COALESCE(?, notes),
              updated_at = ?
          WHERE id = ?
          RETURNING *
        `,
        args: [
          updates.schoolId || null,
          updates.gradeId || null,
          updates.firstName || null,
          updates.lastName || null,
          updates.studentId || null,
          updates.email || null,
          updates.phone || null,
          updates.address || null,
          updates.birthDate || null,
          updates.gender || null,
          updates.emergencyContactName || null,
          updates.emergencyContactPhone || null,
          updates.status || null,
          updates.enrollmentDate || null,
          updates.graduationDate || null,
          updates.notes || null,
          now,
          id,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Student not found');
      }

      const row = result.rows[0] as any;
      const student: Student = {
        id: row.id,
        schoolId: row.school_id,
        gradeId: row.grade_id,
        firstName: row.first_name,
        lastName: row.last_name,
        studentId: row.student_id,
        email: row.email,
        phone: row.phone,
        address: row.address,
        birthDate: row.birth_date,
        gender: row.gender,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        status: row.status,
        enrollmentDate: row.enrollment_date,
        graduationDate: row.graduation_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: student, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async deleteStudent(id: string): Promise<DatabaseResult<void>> {
    try {
      await this.client.execute({
        sql: 'DELETE FROM students WHERE id = ?',
        args: [id],
      });

      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  // Payment Operations
  async createPayment(payment: Omit<Payment, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<Payment>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO payments (
            id, student_id, amount, payment_type, payment_method, payment_date, due_date,
            status, description, reference_number, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          payment.id,
          payment.studentId,
          payment.amount,
          payment.paymentType,
          payment.paymentMethod,
          payment.paymentDate,
          payment.dueDate || null,
          payment.status,
          payment.description || null,
          payment.referenceNumber || null,
          now,
          now,
        ],
      });

      const row = result.rows[0] as any;
      const paymentData: Payment = {
        id: row.id,
        studentId: row.student_id,
        amount: row.amount,
        paymentType: row.payment_type,
        paymentMethod: row.payment_method,
        paymentDate: row.payment_date,
        dueDate: row.due_date,
        status: row.status,
        description: row.description,
        referenceNumber: row.reference_number,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: paymentData, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getPayments(
    filters: PaymentFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<Payment>>> {
    try {
      const { limit = 20, offset = 0, orderBy = 'payment_date', orderDirection = 'desc' } = pagination;
      const { studentId, schoolId, gradeId, paymentType, status, paymentMethod, dateFrom, dateTo } = filters;

      let sql = `
        SELECT p.*
        FROM payments p
        LEFT JOIN students s ON p.student_id = s.id
        WHERE 1=1
      `;
      const args: any[] = [];

      if (studentId) {
        sql += ' AND p.student_id = ?';
        args.push(studentId);
      }

      if (schoolId) {
        sql += ' AND s.school_id = ?';
        args.push(schoolId);
      }

      if (gradeId) {
        sql += ' AND s.grade_id = ?';
        args.push(gradeId);
      }

      if (paymentType) {
        sql += ' AND p.payment_type = ?';
        args.push(paymentType);
      }

      if (status) {
        sql += ' AND p.status = ?';
        args.push(status);
      }

      if (paymentMethod) {
        sql += ' AND p.payment_method = ?';
        args.push(paymentMethod);
      }

      if (dateFrom) {
        sql += ' AND p.payment_date >= ?';
        args.push(dateFrom);
      }

      if (dateTo) {
        sql += ' AND p.payment_date <= ?';
        args.push(dateTo);
      }

      sql += ` ORDER BY p.${orderBy} ${orderDirection.toUpperCase()}`;
      sql += ' LIMIT ? OFFSET ?';
      args.push(limit + 1, offset);

      const result = await this.client.execute({ sql, args });
      
      const hasMore = result.rows.length > limit;
      const payments = result.rows.slice(0, limit).map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        amount: row.amount,
        paymentType: row.payment_type,
        paymentMethod: row.payment_method,
        paymentDate: row.payment_date,
        dueDate: row.due_date,
        status: row.status,
        description: row.description,
        referenceNumber: row.reference_number,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const paginatedResult: PaginatedResult<Payment> = {
        data: payments,
        total: payments.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
      };

      return { data: paginatedResult, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  // Student Photo Operations
  async createStudentPhoto(photo: Omit<StudentPhoto, 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<StudentPhoto>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.client.execute({
        sql: `
          INSERT INTO student_photos (id, student_id, photo_url, photo_type, taken_date, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          photo.id,
          photo.studentId,
          photo.photoUrl,
          photo.photoType,
          photo.takenDate,
          photo.metadata ? JSON.stringify(photo.metadata) : null,
          now,
          now,
        ],
      });

      const row = result.rows[0] as any;
      const photoData: StudentPhoto = {
        id: row.id,
        studentId: row.student_id,
        photoUrl: row.photo_url,
        photoType: row.photo_type,
        takenDate: row.taken_date,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return { data: photoData, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleDatabaseError(error), success: false };
    }
  }

  async getStudentPhotos(
    filters: StudentPhotoFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<StudentPhoto>>> {
    try {
      const { limit = 20, offset = 0, orderBy = 'taken_date', orderDirection = 'desc' } = pagination;
      const { studentId, photoType, dateFrom, dateTo } = filters;

      let sql = 'SELECT * FROM student_photos WHERE 1=1';
      const args: any[] = [];

      if (studentId) {
        sql += ' AND student_id = ?';
        args.push(studentId);
      }

      if (photoType) {
        sql += ' AND photo_type = ?';
        args.push(photoType);
      }

      if (dateFrom) {
        sql += ' AND taken_date >= ?';
        args.push(dateFrom);
      }

      if (dateTo) {
        sql += ' AND taken_date <= ?';
        args.push(dateTo);
      }

      sql += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
      sql += ' LIMIT ? OFFSET ?';
      args.push(limit + 1, offset);

      const result = await this.client.execute({ sql, args });
      
      const hasMore = result.rows.length > limit;
      const photos = result.rows.slice(0, limit).map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        photoUrl: row.photo_url,
        photoType: row.photo_type,
        takenDate: row.taken_date,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const paginatedResult: PaginatedResult<StudentPhoto> = {
        data: photos,
        total: photos.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
      };

      return { data: paginatedResult, error: null, success: true };
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