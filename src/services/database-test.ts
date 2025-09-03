/**
 * Database connectivity and CRUD operations test
 * Run this to validate that the database setup is working correctly
 */

import { databaseService } from './database-service';
import { generateId } from '../utils/id-generator';
import type { School, Grade, Student } from '../types/database';

interface TestResult {
  operation: string;
  success: boolean;
  message: string;
  duration: number;
}

/**
 * Test database connectivity and basic operations
 */
export async function runDatabaseTests(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Helper function to run a test operation
  const runTest = async (
    operation: string,
    testFunction: () => Promise<void>
  ): Promise<void> => {
    const startTime = Date.now();
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      results.push({
        operation,
        success: true,
        message: 'Operación completada exitosamente',
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        operation,
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        duration,
      });
    }
  };

  // Test 1: Initialize tables
  await runTest('Inicializar tablas', async () => {
    const result = await databaseService.initializeTables();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to initialize tables');
    }
  });

  // Test data
  let testSchoolId: string;
  let testGradeId: string;
  let testStudentId: string;

  // Test 2: Create a school
  await runTest('Crear escuela de prueba', async () => {
    testSchoolId = generateId.school();
    const schoolData: Omit<School, 'createdAt' | 'updatedAt'> = {
      id: testSchoolId,
      userId,
      name: 'Escuela de Prueba',
      address: 'Dirección de Prueba 123',
      phone: '5551234567',
      email: 'test@escuela.com',
      status: 'active',
      debtAmount: 0,
    };

    const result = await databaseService.createSchool(schoolData);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create school');
    }
  });

  // Test 3: Read the created school
  await runTest('Leer escuela creada', async () => {
    const result = await databaseService.getSchool(testSchoolId);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to read school');
    }
    if (!result.data) {
      throw new Error('School not found after creation');
    }
  });

  // Test 4: Create a grade
  await runTest('Crear grado de prueba', async () => {
    testGradeId = generateId.grade();
    const gradeData: Omit<Grade, 'createdAt' | 'updatedAt'> = {
      id: testGradeId,
      schoolId: testSchoolId,
      name: 'Grado de Prueba',
      level: 'Primaria',
      academicYear: '2024',
    };

    const result = await databaseService.createGrade(gradeData);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create grade');
    }
  });

  // Test 5: Create a student
  await runTest('Crear estudiante de prueba', async () => {
    testStudentId = generateId.student();
    const studentData: Omit<Student, 'createdAt' | 'updatedAt'> = {
      id: testStudentId,
      schoolId: testSchoolId,
      gradeId: testGradeId,
      firstName: 'Juan',
      lastName: 'Pérez',
      studentId: 'EST001',
      email: 'juan.perez@email.com',
      phone: '5559876543',
      status: 'active',
      enrollmentDate: '2024-01-01',
    };

    const result = await databaseService.createStudent(studentData);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create student');
    }
  });

  // Test 6: Query schools with filters
  await runTest('Consultar escuelas con filtros', async () => {
    const result = await databaseService.getSchools({ userId }, { limit: 10 });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to query schools');
    }
    if (!result.data || result.data.data.length === 0) {
      throw new Error('No schools found in query results');
    }
  });

  // Test 7: Query grades for the school
  await runTest('Consultar grados de la escuela', async () => {
    const result = await databaseService.getGrades({ schoolId: testSchoolId });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to query grades');
    }
    if (!result.data || result.data.data.length === 0) {
      throw new Error('No grades found for the school');
    }
  });

  // Test 8: Query students for the grade
  await runTest('Consultar estudiantes del grado', async () => {
    const result = await databaseService.getStudents({ gradeId: testGradeId });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to query students');
    }
    if (!result.data || result.data.data.length === 0) {
      throw new Error('No students found for the grade');
    }
  });

  // Test 9: Update student
  await runTest('Actualizar estudiante', async () => {
    const result = await databaseService.updateStudent(testStudentId, {
      email: 'juan.updated@email.com',
      phone: '5551111111',
    });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update student');
    }
  });

  // Test 10: Update school
  await runTest('Actualizar escuela', async () => {
    const result = await databaseService.updateSchool(testSchoolId, {
      phone: '5554444444',
      debtAmount: 1000,
    });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update school');
    }
  });

  // Cleanup: Delete test data (in reverse order)
  await runTest('Limpiar datos de prueba - Estudiante', async () => {
    const result = await databaseService.deleteStudent(testStudentId);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete student');
    }
  });

  await runTest('Limpiar datos de prueba - Grado', async () => {
    const result = await databaseService.deleteGrade(testGradeId);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete grade');
    }
  });

  await runTest('Limpiar datos de prueba - Escuela', async () => {
    const result = await databaseService.deleteSchool(testSchoolId);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete school');
    }
  });

  return results;
}

/**
 * Print test results in a formatted way
 */
export function printTestResults(results: TestResult[]): void {
  console.log('\n📊 RESULTADOS DE PRUEBAS DE BASE DE DATOS');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;
  let totalDuration = 0;

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    
    console.log(`${index + 1}. ${status} ${result.operation} (${duration})`);
    if (!result.success) {
      console.log(`   Error: ${result.message}`);
    }

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    totalDuration += result.duration;
  });

  console.log('=' .repeat(50));
  console.log(`📈 Resumen: ${passed} exitosas, ${failed} fallidas`);
  console.log(`⏱️  Tiempo total: ${totalDuration}ms`);
  
  if (failed === 0) {
    console.log('🎉 Todas las pruebas pasaron! La base de datos está funcionando correctamente.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }
}

/**
 * Quick connectivity test
 */
export async function testDatabaseConnectivity(): Promise<boolean> {
  try {
    const result = await databaseService.initializeTables();
    return result.success;
  } catch (error) {
    console.error('Database connectivity test failed:', error);
    return false;
  }
}