/**
 * Validation utilities for form inputs and data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic format check)
 */
export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10;
}

/**
 * Validate required string field
 */
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} es requerido`;
  }
  return null;
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function validateDate(dateString: string): boolean {
  if (!dateString) return true; // Optional field
  
  const date = new Date(dateString);
  const today = new Date();
  
  // Check if date is valid and not in the future
  return !isNaN(date.getTime()) && date <= today;
}

/**
 * Validate year (for academic year)
 */
export function validateYear(year: string): boolean {
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();
  return !isNaN(yearNum) && yearNum >= 1900 && yearNum <= currentYear + 10;
}

/**
 * Validate school data
 */
export function validateSchoolData(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  const nameError = validateRequired(data.name, 'Nombre de la escuela');
  if (nameError) errors.name = nameError;

  const addressError = validateRequired(data.address, 'Dirección');
  if (addressError) errors.address = addressError;

  // Optional fields with format validation
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Formato de email inválido';
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Formato de teléfono inválido (mínimo 10 dígitos)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate grade data
 */
export function validateGradeData(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  const nameError = validateRequired(data.name, 'Nombre del grado');
  if (nameError) errors.name = nameError;

  const levelError = validateRequired(data.level, 'Nivel educativo');
  if (levelError) errors.level = levelError;

  const yearError = validateRequired(data.academicYear, 'Año académico');
  if (yearError) {
    errors.academicYear = yearError;
  } else if (!validateYear(data.academicYear)) {
    errors.academicYear = 'Año académico inválido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate student data
 */
export function validateStudentData(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  const firstNameError = validateRequired(data.firstName, 'Nombre');
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateRequired(data.lastName, 'Apellido');
  if (lastNameError) errors.lastName = lastNameError;

  const studentIdError = validateRequired(data.studentId, 'Número de estudiante');
  if (studentIdError) errors.studentId = studentIdError;

  // Optional fields with format validation
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Formato de email inválido';
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Formato de teléfono inválido (mínimo 10 dígitos)';
  }

  if (data.emergencyContactPhone && !validatePhone(data.emergencyContactPhone)) {
    errors.emergencyContactPhone = 'Formato de teléfono inválido (mínimo 10 dígitos)';
  }

  // Emergency contact validation - if name is provided, phone is required
  if (data.emergencyContactName && data.emergencyContactName.trim() && 
      (!data.emergencyContactPhone || !data.emergencyContactPhone.trim())) {
    errors.emergencyContactPhone = 'Teléfono de contacto de emergencia es requerido';
  }

  // Birth date validation
  if (data.birthDate && !validateDate(data.birthDate)) {
    errors.birthDate = 'Fecha de nacimiento inválida o futura';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate payment data
 */
export function validatePaymentData(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.amount || data.amount <= 0) {
    errors.amount = 'El monto debe ser mayor a 0';
  }

  const paymentTypeError = validateRequired(data.paymentType, 'Tipo de pago');
  if (paymentTypeError) errors.paymentType = paymentTypeError;

  const paymentMethodError = validateRequired(data.paymentMethod, 'Método de pago');
  if (paymentMethodError) errors.paymentMethod = paymentMethodError;

  const paymentDateError = validateRequired(data.paymentDate, 'Fecha de pago');
  if (paymentDateError) errors.paymentDate = paymentDateError;

  // Date validation
  if (data.paymentDate && !validateDate(data.paymentDate)) {
    errors.paymentDate = 'Fecha de pago inválida';
  }

  if (data.dueDate && !validateDate(data.dueDate)) {
    errors.dueDate = 'Fecha de vencimiento inválida';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize input string (remove extra whitespace, basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    }
  }
  
  return sanitized;
}