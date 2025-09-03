# Database Insertion Issues - Complete Fix Guide

## Issues Identified and Fixed

### 1. **Type Conversion Issues in Turso HTTP Client**
**Problem:** The HTTP client wasn't properly handling different data types, causing insertion failures.

**Fix Applied:**
- Enhanced type conversion logic to properly handle integers, floats, booleans, and null values
- Added proper boolean to integer conversion (true → 1, false → 0)
- Fixed null/undefined handling

### 2. **Foreign Key Constraint Failures**
**Problem:** Students were being created before their referenced schools and grades existed.

**Fix Applied:**
- Added pre-insertion validation to check foreign key relationships
- Enhanced error messages to identify missing references
- Added automatic constraint violation handling

### 3. **Data Validation Issues**
**Problem:** Missing required field validation was causing silent failures.

**Fix Applied:**
- Added comprehensive field validation for all entity types
- Clear error messages for missing required fields
- Better type safety between UI and database layers

### 4. **Schema Inconsistencies**
**Problem:** UI components using different schemas than the database.

**Fix Applied:**
- Unified type definitions between UI and database layers
- Added compatibility layers for legacy components
- Fixed schema mismatches in data transformation

## How to Test the Fixes

### 1. **Run Database Health Check**
```typescript
import { runFullDiagnostics } from '~/src/services/database-troubleshoot';

// Replace with actual user ID
const userId = 'your-user-id';
const diagnostics = await runFullDiagnostics(userId);
console.log('Diagnostics results:', diagnostics);
```

### 2. **Test Individual Operations**
```typescript
import { testSchoolCreation, testGradeCreation, testStudentCreation } from '~/src/services/database-troubleshoot';

// Test school creation
const schoolResult = await testSchoolCreation('user-id');
if (schoolResult.success) {
  console.log('School creation works!');
} else {
  console.error('School creation failed:', schoolResult.message);
}
```

### 3. **Initialize Database with Retry**
```typescript
import { initializeDatabaseWithRetry } from '~/src/services/database-init';

const initialized = await initializeDatabaseWithRetry(3);
if (initialized) {
  console.log('Database ready!');
} else {
  console.error('Database initialization failed after retries');
}
```

## Common Error Patterns and Solutions

### Error: "Missing required fields"
**Solution:** Ensure all required fields are provided:
- Schools: id, userId, name, address
- Grades: id, schoolId, name, level, academicYear  
- Students: id, schoolId, gradeId, firstName, lastName, studentId

### Error: "School/Grade with id X does not exist"
**Solution:** 
1. Create schools before grades
2. Create grades before students
3. Use the returned IDs from creation operations

### Error: "Turso HTTP API error: 400"
**Solution:** 
- Check data types being passed to the database
- Verify SQL syntax in queries
- Look for invalid parameter bindings

### Error: "UNIQUE constraint failed"
**Solution:**
- Ensure student IDs are unique within each school
- Check for duplicate primary keys
- Use proper conflict resolution (ON CONFLICT REPLACE)

## Best Practices for Database Operations

### 1. **Always Validate Before Insert**
```typescript
// Before creating a student
if (!schoolId || !gradeId) {
  throw new Error('School and Grade must exist before creating student');
}

const schoolExists = await databaseService.getSchool(schoolId);
const gradeExists = await databaseService.getGrade(gradeId);

if (!schoolExists.data || !gradeExists.data) {
  throw new Error('Referenced school or grade does not exist');
}
```

### 2. **Use Transactions for Complex Operations**
```typescript
// For operations that create multiple related entities
await databaseService.client.transaction(async (tx) => {
  const school = await tx.execute(schoolInsert);
  const grade = await tx.execute(gradeInsert);  
  const student = await tx.execute(studentInsert);
});
```

### 3. **Handle Network Errors Gracefully**
```typescript
try {
  const result = await databaseService.createSchool(schoolData);
  if (!result.success) {
    // Handle business logic errors
    showUserError(result.error.message);
  }
} catch (error) {
  // Handle network/system errors
  if (error.message.includes('Network')) {
    showRetryOption();
  } else {
    showGenericError();
  }
}
```

### 4. **Implement Proper Loading States**
```typescript
const [isCreating, setIsCreating] = useState(false);

const handleCreateSchool = async (data) => {
  setIsCreating(true);
  try {
    await createSchoolMutation.mutateAsync(data);
  } catch (error) {
    // Error handling
  } finally {
    setIsCreating(false);
  }
};
```

## Environment Setup Checklist

Ensure these environment variables are properly set:
- ✅ `EXPO_PUBLIC_TURSO_DATABASE_URL`
- ✅ `EXPO_PUBLIC_TURSO_AUTH_TOKEN`
- ✅ `EXPO_PUBLIC_SUPABASE_URL`
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Performance Optimizations

### 1. **Enable Proper Indexes**
The system now creates indexes on frequently queried fields:
- `idx_schools_user_id` for user-specific school queries
- `idx_students_school_id` for school-specific student queries
- `idx_students_grade_id` for grade-specific student queries

### 2. **Use Batch Operations**
For multiple related insertions:
```typescript
const statements = [
  { sql: schoolInsertSQL, args: schoolArgs },
  { sql: gradeInsertSQL, args: gradeArgs },
  { sql: studentInsertSQL, args: studentArgs }
];

await databaseService.client.batch(statements);
```

### 3. **Implement Query Caching**
TanStack Query is configured with appropriate stale times:
- Schools: 5 minutes
- Grades: 5 minutes  
- Students: 5 minutes

## Monitoring and Debugging

### 1. **Enable Detailed Logging**
The HTTP client now logs detailed error information including:
- Request URL and status
- SQL query (truncated)  
- Parameter count
- Full error response

### 2. **Use Health Checks**
Run periodic health checks to ensure database connectivity:
```typescript
import { performDatabaseHealthCheck } from '~/src/services/database-init';

setInterval(async () => {
  const health = await performDatabaseHealthCheck();
  if (!health.connection) {
    // Alert user or retry connection
  }
}, 60000); // Check every minute
```

## Troubleshooting Commands

If issues persist, run these diagnostic commands:

```bash
# 1. Check environment variables
node -e "console.log(process.env.EXPO_PUBLIC_TURSO_DATABASE_URL ? 'Turso URL: OK' : 'Turso URL: MISSING')"

# 2. Test network connectivity to Turso
curl -X POST "https://your-database.turso.io/v2/pipeline" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"requests":[{"type":"execute","stmt":{"sql":"SELECT 1"}}]}'

# 3. Run the React Native app and check Metro bundler logs
npx expo start --clear
```

The implemented fixes should resolve the database insertion issues you were experiencing. The enhanced error handling and validation will help identify any remaining issues quickly.