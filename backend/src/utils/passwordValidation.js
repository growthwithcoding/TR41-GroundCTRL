/**
 * Password Validation Utility
 * Validates password strength and checks against common passwords
 */

/**
 * Common weak passwords to reject
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'superman', 'qazwsx', 'michael', 'football', 'welcome'
];

/**
 * Password validation rules
 * Updated to align with SECURITY_REQUIREMENTS_CHECKLIST_UPDATED.md
 * Minimum 12 characters as per security document by Mohana
 */
const PASSWORD_RULES = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '@$!%*?&#^()_+-=[]{}|;:,.<>/'
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with success flag and errors array
 */
function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return {
      success: false,
      errors: ['Password is required']
    };
  }

  // Check length
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters long`);
  }
  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_RULES.maxLength} characters`);
  }

  // Check uppercase
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check number
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check special character
  if (PASSWORD_RULES.requireSpecialChar) {
    const specialCharRegex = new RegExp(`[${PASSWORD_RULES.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&#^()_+-=[]{}|;:,.<>/)');
    }
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Check if password meets minimum requirements
 * @param {string} password - Password to check
 * @returns {boolean} True if password meets minimum requirements
 */
function meetsMinimumRequirements(password) {
  const result = validatePassword(password);
  return result.success;
}

module.exports = {
  validatePassword,
  meetsMinimumRequirements,
  PASSWORD_RULES
};
