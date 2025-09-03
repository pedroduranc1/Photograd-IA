/**
 * Database Troubleshooting and Testing Utilities
 * 
 * This module provides comprehensive testing and troubleshooting tools
 * to diagnose and fix database insertion issues.
 */

import { databaseService } from './database-service';
import type { SchoolWithStats, Grade, Student, StudentWithDetails } from '../types/database';

export interface TroubleshootResult {
  success: boolean;
  message: string;
  error?: any;
  details?: any;
}

/**
 * Test school creation with comprehensive validation
 */
export async function testSchoolCreation(userId: string): Promise<TroubleshootResult> {
  try {
    console.log('🏫 Testing school creation...');

    const testSchool = {
      id: `test-school-${Date.now()}`,
      userId,
      name: 'Test School for Troubleshooting',
      address: '123 Test Street, Test City',
      phone: '+1-555-123-4567',
      email: 'test@school.edu',
      status: 'active' as const,
      debtAmount: 0,
      nextGraduation: '2024-06-15',
    };

    console.log('📝 Creating school with data:', JSON.stringify(testSchool, null, 2));

    const result = await databaseService.createSchool(testSchool);

    if (result.success && result.data) {
      console.log('✅ School created successfully:', result.data.name);
      return {
        success: true,
        message: 'School creation successful',
        details: result.data,
      };
    } else {
      console.error('❌ School creation failed:', result.error);
      return {
        success: false,
        message: `School creation failed: ${result.error?.message}`,
        error: result.error,
        details: testSchool,
      };
    }
  } catch (error) {
    console.error('❌ School creation threw exception:', error);
    return {
      success: false,
      message: `School creation exception: ${error instanceof Error ? error.message : String(error)}`,
      error,
    };
  }
}

/**
 * Test grade creation with foreign key validation
 */
export async function testGradeCreation(schoolId: string): Promise<TroubleshootResult> {
  try {
    console.log('📚 Testing grade creation...');

    const testGrade = {
      id: `test-grade-${Date.now()}`,
      schoolId,
      name: 'Test Grade 1',
      level: 'Primary',
      academicYear: '2024',
    };

    console.log('📝 Creating grade with data:', JSON.stringify(testGrade, null, 2));

    const result = await databaseService.createGrade(testGrade);

    if (result.success && result.data) {
      console.log('✅ Grade created successfully:', result.data.name);
      return {
        success: true,
        message: 'Grade creation successful',
        details: result.data,
      };
    } else {
      console.error('❌ Grade creation failed:', result.error);
      return {
        success: false,
        message: `Grade creation failed: ${result.error?.message}`,
        error: result.error,
        details: testGrade,
      };
    }
  } catch (error) {
    console.error('❌ Grade creation threw exception:', error);
    return {
      success: false,
      message: `Grade creation exception: ${error instanceof Error ? error.message : String(error)}`,
      error,
    };
  }
}

/**
 * Test student creation with all validations
 */
export async function testStudentCreation(schoolId: string, gradeId: string): Promise<TroubleshootResult> {
  try {
    console.log('👨‍🎓 Testing student creation...');

    const testStudent = {
      id: `test-student-${Date.now()}`,
      schoolId,
      gradeId,
      firstName: 'Test',
      lastName: 'Student',
      studentId: `STU-${Date.now()}`,
      email: 'test.student@email.com',
      phone: '+1-555-999-8888',
      address: '456 Student Lane',
      birthDate: '2010-01-15',
      gender: 'other' as const,
      emergencyContactName: 'Parent Test',
      emergencyContactPhone: '+1-555-777-6666',
      status: 'active' as const,
      enrollmentDate: '2024-01-15',
      notes: 'Test student for troubleshooting',
    };

    console.log('📝 Creating student with data:', JSON.stringify(testStudent, null, 2));

    const result = await databaseService.createStudent(testStudent);

    if (result.success && result.data) {
      console.log('✅ Student created successfully:', `${result.data.firstName} ${result.data.lastName}`);
      return {
        success: true,
        message: 'Student creation successful',
        details: result.data,
      };
    } else {
      console.error('❌ Student creation failed:', result.error);
      return {
        success: false,
        message: `Student creation failed: ${result.error?.message}`,
        error: result.error,
        details: testStudent,
      };
    }
  } catch (error) {
    console.error('❌ Student creation threw exception:', error);
    return {
      success: false,
      message: `Student creation exception: ${error instanceof Error ? error.message : String(error)}`,
      error,
    };
  }
}

/**
 * Run comprehensive CRUD operation tests
 */
export async function runCRUDTests(userId: string): Promise<{
  school: TroubleshootResult;
  grade: TroubleshootResult;
  student: TroubleshootResult;
  overall: boolean;
}> {
  console.log('🚀 Running comprehensive CRUD tests...\n');

  // Test 1: School creation
  const schoolResult = await testSchoolCreation(userId);
  
  let gradeResult: TroubleshootResult = { success: false, message: 'Skipped due to school creation failure' };
  let studentResult: TroubleshootResult = { success: false, message: 'Skipped due to previous failures' };

  // Test 2: Grade creation (only if school creation succeeded)
  if (schoolResult.success && schoolResult.details) {
    gradeResult = await testGradeCreation(schoolResult.details.id);

    // Test 3: Student creation (only if grade creation succeeded)
    if (gradeResult.success && gradeResult.details) {
      studentResult = await testStudentCreation(schoolResult.details.id, gradeResult.details.id);
    }
  }

  const overall = schoolResult.success && gradeResult.success && studentResult.success;

  console.log('\n📊 CRUD Test Results:');
  console.log(`School: ${schoolResult.success ? '✅' : '❌'} - ${schoolResult.message}`);
  console.log(`Grade: ${gradeResult.success ? '✅' : '❌'} - ${gradeResult.message}`);
  console.log(`Student: ${studentResult.success ? '✅' : '❌'} - ${studentResult.message}`);
  console.log(`Overall: ${overall ? '✅' : '❌'}`);

  return {
    school: schoolResult,
    grade: gradeResult,
    student: studentResult,
    overall,
  };
}

/**
 * Test data integrity and foreign key relationships
 */
export async function testDataIntegrity(): Promise<TroubleshootResult[]> {
  const results: TroubleshootResult[] = [];

  try {
    console.log('🔍 Testing data integrity...');

    // Test 1: Orphaned grades (grades without valid school)
    const orphanedGrades = await databaseService.client.execute({
      sql: `
        SELECT g.id, g.name, g.school_id 
        FROM grades g 
        LEFT JOIN schools s ON g.school_id = s.id 
        WHERE s.id IS NULL
        LIMIT 10
      `,
      args: [],
    });

    results.push({
      success: orphanedGrades.rows.length === 0,
      message: `Found ${orphanedGrades.rows.length} orphaned grades`,
      details: orphanedGrades.rows,
    });

    // Test 2: Orphaned students (students without valid school or grade)
    const orphanedStudents = await databaseService.client.execute({
      sql: `
        SELECT s.id, s.first_name, s.last_name, s.school_id, s.grade_id
        FROM students s 
        LEFT JOIN schools sc ON s.school_id = sc.id 
        LEFT JOIN grades g ON s.grade_id = g.id
        WHERE sc.id IS NULL OR g.id IS NULL
        LIMIT 10
      `,
      args: [],
    });

    results.push({
      success: orphanedStudents.rows.length === 0,
      message: `Found ${orphanedStudents.rows.length} orphaned students`,
      details: orphanedStudents.rows,
    });

    // Test 3: Duplicate student IDs within schools
    const duplicateStudentIds = await databaseService.client.execute({
      sql: `
        SELECT school_id, student_id, COUNT(*) as count
        FROM students 
        GROUP BY school_id, student_id 
        HAVING COUNT(*) > 1
        LIMIT 10
      `,
      args: [],
    });

    results.push({
      success: duplicateStudentIds.rows.length === 0,
      message: `Found ${duplicateStudentIds.rows.length} duplicate student IDs`,
      details: duplicateStudentIds.rows,
    });

  } catch (error) {
    results.push({
      success: false,
      message: `Data integrity check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    });
  }

  return results;
}

/**
 * Analyze database schema and constraints
 */
export async function analyzeSchema(): Promise<TroubleshootResult[]> {
  const results: TroubleshootResult[] = [];

  try {
    console.log('📋 Analyzing database schema...');

    // Get table information
    const tables = await databaseService.client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      args: [],
    });

    for (const table of tables.rows) {
      const tableName = (table as any).name;
      
      // Get table schema
      const schema = await databaseService.client.execute({
        sql: `PRAGMA table_info(${tableName})`,
        args: [],
      });

      // Get foreign keys
      const foreignKeys = await databaseService.client.execute({
        sql: `PRAGMA foreign_key_list(${tableName})`,
        args: [],
      });

      // Get indexes
      const indexes = await databaseService.client.execute({
        sql: `PRAGMA index_list(${tableName})`,
        args: [],
      });

      results.push({
        success: true,
        message: `Schema for table ${tableName}`,
        details: {
          table: tableName,
          columns: schema.rows,
          foreignKeys: foreignKeys.rows,
          indexes: indexes.rows,
        },
      });
    }

  } catch (error) {
    results.push({
      success: false,
      message: `Schema analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    });
  }

  return results;
}

/**
 * Run all troubleshooting tests
 */
export async function runFullDiagnostics(userId: string): Promise<{
  crudTests: any;
  integrityTests: TroubleshootResult[];
  schemaAnalysis: TroubleshootResult[];
  success: boolean;
}> {
  console.log('🔬 Running full database diagnostics...\n');

  const crudTests = await runCRUDTests(userId);
  console.log('');
  
  const integrityTests = await testDataIntegrity();
  console.log('');
  
  const schemaAnalysis = await analyzeSchema();

  const success = crudTests.overall && 
                 integrityTests.every(result => result.success) &&
                 schemaAnalysis.length > 0;

  console.log(`\n🏁 Full diagnostics completed: ${success ? '✅ PASSED' : '❌ FAILED'}`);

  return {
    crudTests,
    integrityTests,
    schemaAnalysis,
    success,
  };
}