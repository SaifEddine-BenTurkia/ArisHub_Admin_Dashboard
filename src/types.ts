export type AdminRole = 'SUPER_ADMIN' | 'MODERATOR';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ProviderSummary {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber: string;
  businessName?: string | null;
  category: string[];
  isApproved: boolean;
  verificationStatus?: string;
  approvedAt?: string | null;
  walletBalance: number | string;
  totalEarnings: number | string;
  completedJobs: number;
  averageRating: number | string;
  totalRatings: number;
  createdAt: string;
  profileImage?: string | null;
  serviceAreas?: unknown;
}

export interface ProviderDetail extends ProviderSummary {
  cinFront?: string | null;
  cinBack?: string | null;
  verificationSelfie?: string | null;
  contractSigned?: boolean;
  contractSignedAt?: string | null;
  approvalNotes?: string | null;
  description?: string | null;
  yearsExperience?: number;
  services?: Array<{ id: string; name: string; description?: string; price: number | string }>;
  certifications?: Array<{ id?: string; name?: string } | string>;
  galleryImages?: Array<{ id: string; imageUrl: string }>;
  transactions?: Transaction[];
  applications?: Array<{ id: string; job?: { id: string; title: string; status: string } }>;
  _count?: { applications?: number; confirmedJobs?: number };
}

export interface RechargeRequest {
  id: string;
  providerId: string;
  amount: number | string;
  paymentReference: string;
  receiptUrl?: string | null;
  proofImage?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  provider: { id: string; fullName: string; phoneNumber: string; walletBalance: number | string };
}

export interface ClientSummary {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber: string;
  gouvernement?: string | null;
  delegation?: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt: string;
  profileImage?: string | null;
  _count?: { jobsPosted: number };
}

export interface JobSummary {
  id: string;
  title: string;
  status: string;
  category: string;
  clientName?: string;
  gouvernement?: string;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  fixedPrice?: number | string | null;
  totalApplicants: number;
  isConfirmed: boolean;
  createdAt: string;
  completedAt?: string | null;
  client?: { id: string; fullName: string; email?: string };
  confirmedProvider?: { id: string; fullName: string; businessName?: string | null } | null;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  description?: string;
  balanceBefore?: number | string;
  balanceAfter?: number | string;
  createdAt: string;
}

export interface DashboardOverview {
  users: {
    totalClients: number;
    newClientsThisMonth: number;
    totalProviders: number;
    approvedProviders: number;
    pendingProviders: number;
    newProvidersThisMonth: number;
  };
  jobs: { total: number; open: number; completed: number; thisMonth: number; completionRate: string };
  financials: {
    totalWalletBalance: number | string;
    totalEarningsPaidOut: number | string;
    totalCommissionCollected: number | string;
    commissionThisMonth: number | string;
  };
  totalPreRegistrations: number;
  generatedAt: string;
}
