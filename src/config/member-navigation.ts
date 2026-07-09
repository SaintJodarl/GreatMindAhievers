import {
  LayoutDashboard,
  Network,
  Users,
  UserPlus,
  GitMerge,
  History,
  ShieldCheck,
  FileCheck,
  Files,
  Link,
  QrCode,
  Megaphone,
  Mail,
  GraduationCap,
  LifeBuoy,
  HelpCircle,
  User,
  Settings,
  LogOut,
  UserCheck,
  Trophy,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon?: any;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const memberNavigation: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [{ label: 'Overview', href: '/user-dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'My Network',
    items: [
      { label: 'Binary Tree', href: '/user-dashboard/network/tree', icon: Network },
      { label: 'Direct Referrals', href: '/user-dashboard/network/referrals', icon: Users },
      { label: 'Downline Members', href: '/user-dashboard/network/downline', icon: GitMerge },
      { label: 'Sponsor Information', href: '/user-dashboard/network/sponsor', icon: UserCheck },
    ],
  },
  {
    title: 'Member Registration',
    items: [
      { label: 'Register Member', href: '/user-dashboard/registration/new', icon: UserPlus },
      {
        label: 'Placement Manager',
        href: '/user-dashboard/registration/placement',
        icon: GitMerge,
      },
      {
        label: 'Registration History',
        href: '/user-dashboard/registration/history',
        icon: History,
      },
    ],
  },
  {
    title: 'KYC & Verification',
    items: [
      { label: 'Complete KYC', href: '/user-dashboard/kyc/complete', icon: ShieldCheck },
      { label: 'KYC Status', href: '/user-dashboard/kyc/status', icon: FileCheck },
      { label: 'Documents', href: '/user-dashboard/kyc/documents', icon: Files },
    ],
  },
  {
    title: 'Rewards & Wallet',
    items: [
      { label: 'Rewards', href: '/user-dashboard/rewards', icon: Trophy },
    ],
  },
  {
    title: 'Referral Center',
    items: [
      { label: 'Referral Link', href: '/user-dashboard/referrals/link', icon: Link },
      { label: 'Referral Code', href: '/user-dashboard/referrals/code', icon: QrCode },
      { label: 'Invitation History', href: '/user-dashboard/referrals/history', icon: History },
    ],
  },
  {
    title: 'Announcements',
    items: [
      { label: 'Company News', href: '/user-dashboard/announcements/news', icon: Megaphone },
      { label: 'Welcome Messages', href: '/user-dashboard/announcements/welcome', icon: Mail },
      {
        label: 'Training Resources',
        href: '/user-dashboard/announcements/training',
        icon: GraduationCap,
      },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Support Tickets', href: '/user-dashboard/support/tickets', icon: LifeBuoy },
      { label: 'Help Center', href: '/user-dashboard/support/help', icon: HelpCircle },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', href: '/user-dashboard/account/profile', icon: User },
      { label: 'Security Settings', href: '/user-dashboard/account/security', icon: Settings },
    ],
  },
];
