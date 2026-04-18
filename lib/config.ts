/**
 * Configuration validation and centralized config management
 * LAZY EVALUATION - Only validates when config is accessed at runtime
 */

function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value && defaultValue === undefined) {
    console.warn(`[Config] Warning: Missing environment variable: ${key}`)
    return ''
  }
  return value || defaultValue || ''
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key]
  if (value === undefined) {
    if (defaultValue === undefined) {
      console.warn(`[Config] Warning: Missing environment variable: ${key}`)
      return 0
    }
    return defaultValue
  }
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    console.warn(`[Config] Warning: Invalid number for environment variable ${key}: ${value}`)
    return defaultValue || 0
  }
  return parsed
}

function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key]
  if (value === undefined) {
    if (defaultValue === undefined) {
      return false
    }
    return defaultValue
  }
  return value === 'true' || value === '1' || value === 'yes'
}

// Lazy-loaded config - only validated when actually used
let configValidated = false

export const config = {
  // Database Configuration
  get database() {
    return {
      url: getEnvVariable('DATABASE_URL', ''),
      isConfigured: !!process.env.DATABASE_URL,
    }
  },

  // Redis Configuration (Optional)
  get redis() {
    return {
      url: process.env.REDIS_URL || '',
      enabled: !!process.env.REDIS_URL,
    }
  },

  // App Configuration
  get app() {
    return {
      url: getEnvVariable('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
      nodeEnv: getEnvVariable('NODE_ENV', 'development'),
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    }
  },

  // Admin Authentication Configuration
  get admin() {
    return {
      email: getEnvVariable('ADMIN_EMAIL', 'admin@example.com'),
      password: getEnvVariable('ADMIN_PASSWORD', ''),
      displayName: getEnvVariable('ADMIN_DISPLAY_NAME', 'Administrator'),
      // JWT_SECRET should only be in env vars, never returned as config
      sessionTimeout: getEnvNumber('SESSION_TIMEOUT_MINUTES', 1440),
      maxLoginAttempts: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
      lockoutDuration: getEnvNumber('LOCKOUT_DURATION_MINUTES', 15),
    }
  },

  // Cashfree Payment Gateway Configuration
  get payments() {
    return {
      cashfree: {
        appId: getEnvVariable('CASHFREE_APP_ID', ''),
        secretKey: getEnvVariable('CASHFREE_SECRET_KEY', ''),
        mode: getEnvVariable('CASHFREE_MODE', 'test'),
        webhookSecret: getEnvVariable('CASHFREE_WEBHOOK_SECRET', ''),
      },
    }
  },

  // Mail Configuration
  get mail() {
    return {
      enabled: !!process.env.SMTP_HOST,
      from: getEnvVariable('MAIL_FROM', 'noreply@zws.cloud'),
      smtp: {
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    }
  },

  // Business Configuration
  get business() {
    return {
      name: getEnvVariable('COMPANY_NAME', 'ZWS Cloud'),
      email: getEnvVariable('COMPANY_EMAIL', 'support@zws.cloud'),
      phone: getEnvVariable('COMPANY_PHONE', '+91 80 1234 5678'),
      address: getEnvVariable('COMPANY_ADDRESS', '123 Tech Park, Bangalore'),
      gstIn: process.env.COMPANY_GST_IN || '',
    }
  },

  // Pricing Configuration
  get pricing() {
    return {
      defaultCurrency: getEnvVariable('DEFAULT_CURRENCY', 'INR'),
      defaultTaxRate: getEnvNumber('DEFAULT_TAX_RATE', 18),
      discounts: {
        threeMonth: getEnvNumber('DISCOUNT_3M', 10),
        sixMonth: getEnvNumber('DISCOUNT_6M', 15),
        twelveMonth: getEnvNumber('DISCOUNT_12M', 20),
        twentyFourMonth: getEnvNumber('DISCOUNT_24M', 25),
      },
    }
  },

  // Feature Limits
  get limits() {
    return {
      maxCustomRamGb: getEnvNumber('MAX_CUSTOM_RAM_GB', 256),
      maxCustomCpu: getEnvNumber('MAX_CUSTOM_CPU', 64),
      maxCustomStorageGb: getEnvNumber('MAX_CUSTOM_STORAGE_GB', 4000),
    }
  },

  // Logging Configuration
  get logging() {
    return {
      level: getEnvVariable('LOG_LEVEL', 'info'),
      enableDetailedLogs: getEnvBoolean('ENABLE_DETAILED_LOGS', false),
    }
  },
}

/**
 * Validates critical environment variables for runtime operations
 * Call this only when actually needed (API routes that use the database)
 */
export function validateConfig(): void {
  if (configValidated) return

  const missingVars: string[] = []
  const warnings: string[] = []

  try {
    // Core requirements
    if (!process.env.DATABASE_URL) {
      missingVars.push('DATABASE_URL')
    }
    if (!process.env.ADMIN_EMAIL) {
      warnings.push('ADMIN_EMAIL not set - using default')
    }
    if (!process.env.ADMIN_PASSWORD) {
      warnings.push('ADMIN_PASSWORD not set - auth may fail')
    }
    // JWT_SECRET is critical for auth but should NOT be checked in code
    // it must be set via environment variables only

    // Optional services
    if (!process.env.REDIS_URL) {
      warnings.push('REDIS_URL not set - caching disabled (optional)')
    }
    if (!process.env.SMTP_HOST) {
      warnings.push('SMTP_HOST not set - email features disabled (optional)')
    }

    if (missingVars.length > 0) {
      console.error('[Config] ✗ Critical configuration missing:')
      missingVars.forEach((v) => console.error(`  - ${v}`))
      throw new Error(`Missing ${missingVars.length} critical environment variable(s)`)
    }

    if (warnings.length > 0) {
      console.warn('[Config] ⚠ Optional services not configured:')
      warnings.forEach((w) => console.warn(`  - ${w}`))
    }

    configValidated = true
    console.log('[Config] ✓ Critical configuration validated')
  } catch (error) {
    console.error('[Config] ✗ Configuration validation failed')
    throw error
  }
}

export default config
