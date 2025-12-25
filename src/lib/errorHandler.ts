/**
 * Production Error Handler
 * Sanitizes error messages for end users - prevents leaking technical details
 */

type ErrorSeverity = 'info' | 'warn' | 'error';

interface SanitizedError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
}

// Map of technical error messages to user-friendly messages
const errorMessages: Record<string, string> = {
  // Auth errors
  'Invalid login credentials': 'Email ou palavra-passe incorretos',
  'Email not confirmed': 'Por favor, confirme o seu email antes de entrar',
  'User already registered': 'Este email já está registado',
  'Password should be at least 6 characters': 'A palavra-passe deve ter pelo menos 6 caracteres',
  'Signup requires a valid password': 'Palavra-passe inválida',
  'User not found': 'Utilizador não encontrado',
  'Invalid email': 'Email inválido',
  'Email rate limit exceeded': 'Demasiadas tentativas. Tente novamente mais tarde',
  'Token expired': 'A sessão expirou. Por favor, faça login novamente',
  
  // Database errors
  'duplicate key value violates unique constraint': 'Este registo já existe',
  'violates foreign key constraint': 'Não é possível realizar esta operação',
  'row-level security': 'Não tem permissão para esta ação',
  'permission denied': 'Acesso negado',
  
  // Network errors
  'Failed to fetch': 'Erro de ligação. Verifique a sua internet',
  'Network request failed': 'Erro de rede. Tente novamente',
  'timeout': 'O pedido demorou demasiado. Tente novamente',
  
  // Generic fallbacks
  'internal server error': 'Erro interno. Tente novamente mais tarde',
  'service unavailable': 'Serviço temporariamente indisponível',
};

/**
 * Check if we're in production mode
 */
const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Sanitize error for display to users
 * In production, technical details are hidden
 */
export function sanitizeError(error: unknown): SanitizedError {
  let originalMessage = 'Ocorreu um erro inesperado';
  
  if (error instanceof Error) {
    originalMessage = error.message;
  } else if (typeof error === 'string') {
    originalMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    originalMessage = String((error as { message: unknown }).message);
  }

  // In development, show technical errors
  if (!isProduction()) {
    return {
      message: originalMessage,
      severity: 'error',
    };
  }

  // In production, map to user-friendly messages
  const lowerMessage = originalMessage.toLowerCase();
  
  for (const [pattern, friendlyMessage] of Object.entries(errorMessages)) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return {
        message: friendlyMessage,
        severity: 'error',
      };
    }
  }

  // Default generic message for unrecognized errors
  return {
    message: 'Ocorreu um erro. Por favor, tente novamente.',
    severity: 'error',
  };
}

/**
 * Log error in development only
 * In production, errors are not logged to console
 */
export function logError(error: unknown, context?: string): void {
  if (!isProduction()) {
    if (context) {
      console.error(`[${context}]`, error);
    } else {
      console.error(error);
    }
  }
  // In production, you would send to an error tracking service like Sentry
}

/**
 * Handle API errors with proper sanitization
 */
export function handleApiError(error: unknown): string {
  logError(error, 'API Error');
  return sanitizeError(error).message;
}

/**
 * Safe error logging that never exposes sensitive data
 */
export function safeLog(message: string, data?: Record<string, unknown>): void {
  if (!isProduction()) {
    console.log(message, data);
  }
}

/**
 * Assert condition and throw sanitized error
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(isProduction() ? 'Operação inválida' : message);
  }
}
