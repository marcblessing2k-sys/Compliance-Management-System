export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  failedLoginAttempts?: number;
  isLocked?: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'denied';
  processedBy?: string;
  processedDate?: string;
  notes?: string;
}
