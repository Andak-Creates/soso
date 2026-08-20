export type SubscriptionPlan = 'free' | 'pro';

export interface HostOrganizer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
  paystackSubaccountCode?: string;
  bankName?: string;
  accountNumber?: string;
  lifetimeEarnings: number;
  settledToday: number;
  accumulatingTomorrow: number;
}

export type EventStatus = 'live' | 'draft' | 'ended';

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  startDate: string;
  endDate?: string;
  venueName: string;
  venueAddress?: string;
  isLocationHidden: boolean;
  coverImageUrl: string;
  status: EventStatus;
  capacity: number;
  ticketsSold: number;
  grossRevenue: number;
  absorbPlatformFee: boolean; // Cover Commission & Processing Fees (5%)
  hostNote?: string;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string; // e.g. "General Admission", "VIP Access", "VVIP Table"
  price: number; // in NGN
  quantityAvailable: number;
  quantitySold: number;
  badgeType: 'general' | 'vip' | 'vvip' | 'comp';
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketTierName: string;
  ticketBadge: 'general' | 'vip' | 'vvip' | 'comp';
  amountPaid: number; // in NGN
  platformFee: number;
  netReceived: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface TableSlot {
  id: string;
  eventId: string;
  tableName: string;
  sectionName: string;
  pricePerTable: number;
  totalSeats: number;
  claimedSeats: number;
  claimLink: string;
}

export interface DoorStaffMember {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  appLinkedStatus: 'linked' | 'pending';
}

export interface ConciergePass {
  id: string;
  eventId: string;
  guestName: string;
  guestPhone: string;
  passType: string;
  status: 'delivered' | 'pending' | 'claimed';
  sentAt: string;
}
