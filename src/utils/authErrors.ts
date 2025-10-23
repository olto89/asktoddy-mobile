interface AuthErrorResponse {
  message: string;
  suggestion?: string;
  action?: 'retry' | 'signup' | 'forgot_password' | 'contact_support';
}

export const getAuthErrorMessage = (error: any): AuthErrorResponse => {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Handle specific Supabase error messages
  if (errorMessage.includes('invalid login credentials') || 
      errorMessage.includes('invalid email or password')) {
    return {
      message: 'Email or password is incorrect',
      suggestion: 'Please check your email and password and try again',
      action: 'forgot_password'
    };
  }
  
  if (errorMessage.includes('email not confirmed') || 
      errorMessage.includes('email confirmation')) {
    return {
      message: 'Please verify your email first',
      suggestion: 'Check your inbox for a verification email or request a new one',
      action: 'retry'
    };
  }
  
  if (errorMessage.includes('too many requests') || 
      errorMessage.includes('rate limit')) {
    return {
      message: 'Too many login attempts',
      suggestion: 'Please wait a few minutes before trying again',
      action: 'retry'
    };
  }
  
  if (errorMessage.includes('network') || 
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')) {
    return {
      message: 'Connection problem',
      suggestion: 'Please check your internet connection and try again',
      action: 'retry'
    };
  }
  
  if (errorMessage.includes('user not found') || 
      errorMessage.includes('no user found')) {
    return {
      message: 'No account found with this email',
      suggestion: 'Would you like to create a new account?',
      action: 'signup'
    };
  }
  
  if (errorMessage.includes('weak password') || 
      errorMessage.includes('password too short')) {
    return {
      message: 'Password is too weak',
      suggestion: 'Please use a password with at least 6 characters',
      action: 'retry'
    };
  }
  
  if (errorMessage.includes('invalid email') || 
      errorMessage.includes('malformed email')) {
    return {
      message: 'Invalid email format',
      suggestion: 'Please enter a valid email address',
      action: 'retry'
    };
  }
  
  if (errorMessage.includes('email already registered') || 
      errorMessage.includes('user already registered')) {
    return {
      message: 'Account already exists',
      suggestion: 'Try signing in instead, or use forgot password if needed',
      action: 'retry'
    };
  }
  
  // Generic fallback for unknown errors
  return {
    message: 'Something went wrong',
    suggestion: 'Please try again or contact support if the problem persists',
    action: 'contact_support'
  };
};

export const getActionButtonText = (action?: string): string => {
  switch (action) {
    case 'forgot_password':
      return 'Forgot Password?';
    case 'signup':
      return 'Create Account';
    case 'retry':
      return 'Try Again';
    case 'contact_support':
      return 'Contact Support';
    default:
      return 'Try Again';
  }
};