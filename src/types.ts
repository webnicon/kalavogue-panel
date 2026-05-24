export type AdminRole = 'Super Admin' | 'Staff Admin' | 'Product Manager';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  passwordHash?: string;
  avatar?: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  sale_price: number | null;
  sku: string;
  categories: string[];
  tags: string[];
  stock: number;
  status: 'publish' | 'draft' | 'pending';
  visibility: 'visible' | 'hidden' | 'catalog';
  featured_image: string;
  images: string[];
  seo_title: string;
  seo_desc: string;
  variations: ProductVariation[];
}

export interface UserLoginLog {
  timestamp: string;
  ip: string;
  status: 'success' | 'failed';
  userAgent: string;
}

export interface WooCommerceUser {
  id: string;
  username: string;
  email: string;
  mobile: string;
  role: 'customer' | 'subscriber' | 'vendor';
  registration_date: string;
  total_orders: number;
  wallet_balance: number;
  status: 'active' | 'banned';
  order_history: {
    orderId: string;
    date: string;
    total: number;
    status: string;
  }[];
  login_logs: UserLoginLog[];
}

export interface WooCommerceCoupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  amount: number;
  expiry_date: string;
  usage_limit: number;
  usage_count: number;
  min_amount: number;
  user_specific: string[]; // empty or specific customer emails
  status: 'active' | 'expired' | 'disabled';
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface WooCommerceOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  date_created: string;
  status: 'pending' | 'processing' | 'completed' | 'on-hold' | 'cancelled' | 'refunded';
  total: number;
  items: OrderItem[];
  billing?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method_title?: string;
}

export interface PanelSettings {
  // WordPress API Settings
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  apiEndpoint: string;
  jwtSecret: string;
  apiTimeout: number;
  apiHeaders: string;
  // Panel Customizations
  logo: string;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  sessionTimeout: number; // in minutes
  language: string;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  // Security Panel
  ipWhitelist: string;
  rateLimiting: boolean;
  loginAttemptsLimit: number;
  twoFactorEnabled: boolean;
}

export interface SystemLog {
  id: string;
  type: 'auth' | 'product' | 'user' | 'coupon' | 'settings' | 'error' | 'api';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  admin: string;
  ip?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalCoupons: number;
  totalOrders: number;
  totalRevenue: number;
  apiConnected: boolean;
  websiteStatus: 'online' | 'offline' | 'warning';
  revenueGrowth: number;
}
