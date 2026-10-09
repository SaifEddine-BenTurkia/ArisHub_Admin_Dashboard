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

export interface FunnelRow {
  label: string;
  posted: number;
  withOffer: number;
  /** Requests posted at least an hour ago, the only ones the one-hour target can judge. */
  matured: number;
  offerWithinHour: number;
  medianMinutesToFirstOffer: number | null;
  hired: number;
  completed: number;
  cancelled: number;
}

export interface MarketplaceFunnel {
  days: number;
  since: string;
  generatedAt: string;
  overall: FunnelRow;
  byGovernorate: FunnelRow[];
  byCategory: FunnelRow[];
}

export interface UnansweredJob {
  id: string;
  title: string;
  category: string | null;
  gouvernement: string | null;
  delegation: string | null;
  requestType: 'open' | 'direct' | string;
  clientName: string;
  createdAt: string;
  minutesWaiting: number;
  targetProvider: { fullName: string } | null;
}

export interface UnansweredJobs {
  generatedAt: string;
  thresholdMinutes: number;
  data: UnansweredJob[];
}

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface ReportPerson {
  id: string;
  type: 'client' | 'provider';
  fullName: string;
  phoneNumber: string;
}

export interface Report {
  id: string;
  status: ReportStatus;
  reason: string;
  details: string | null;
  createdAt: string;
  targetType: 'job' | 'user' | 'message' | string;
  targetId: string;
  reporterId: string;
  reporterType: string;
  /** Null when the account was deleted since. */
  reporter: ReportPerson | null;
  /** The person reported, when the report is about a user. */
  reportedUser: ReportPerson | null;
  job: { id: string; title: string; status: string } | null;
}

export interface ReportList extends Paginated<Report> {
  counts: Record<ReportStatus, number>;
}
