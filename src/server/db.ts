import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  AdminUser, 
  Product, 
  WooCommerceUser, 
  WooCommerceCoupon, 
  WooCommerceOrder, 
  PanelSettings, 
  SystemLog 
} from '../types.js';

const DB_FILE = path.join(process.cwd(), 'src', 'server', 'db.json');

interface DatabaseSchema {
  admins: AdminUser[];
  products: Product[];
  users: WooCommerceUser[];
  coupons: WooCommerceCoupon[];
  orders: WooCommerceOrder[];
  settings: PanelSettings;
  logs: SystemLog[];
  adminNotes: { id: string; content: string; updatedAt: string; author: string }[];
}

// Initial seed helper
function createSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);

  const admins: AdminUser[] = [
    {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@woo-admin.com',
      role: 'Super Admin',
      passwordHash: passwordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'admin-2',
      username: 'staff',
      email: 'staff@woo-admin.com',
      role: 'Staff Admin',
      passwordHash: passwordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'admin-3',
      username: 'manager',
      email: 'manager@woo-admin.com',
      role: 'Product Manager',
      passwordHash: passwordHash,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    }
  ];

  const products: Product[] = [
    {
      id: 'prod-101',
      name: 'Wireless Noise-Canceling Headphones Professional',
      description: 'Experience professional-grade acoustic rendering with our state-of-the-art wireless headphones. Built with memory foam ear cushions, 40hr active battery life, and multi-mic adaptive voice rejection technology.',
      short_description: 'Premium wireless headphones with active voice cancellation (ANC) and 40-hour battery life.',
      price: 299.99,
      sale_price: 249.99,
      sku: 'WNC-HP-001',
      categories: ['Electronics', 'Accessories'],
      tags: ['Wireless', 'ANC', 'Audio', 'New'],
      stock: 45,
      status: 'publish',
      visibility: 'visible',
      featured_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80'
      ],
      seo_title: 'Premium Noise-Canceling Headphones | Woo Elite Store',
      seo_desc: 'Buy the highest-rated active noise canceling headphones. Fast shipping, comfortable ergonomics, and high-fidelity output.',
      variations: [
        { id: 'v101-1', name: 'Color: Obsidian Black', price: 249.99, stock: 25, sku: 'WNC-HP-001-BLK' },
        { id: 'v101-2', name: 'Color: Pristine White', price: 259.99, stock: 20, sku: 'WNC-HP-001-WHT' }
      ]
    },
    {
      id: 'prod-102',
      name: 'Minimalist Stainless Steel Smart Wearable Watch',
      description: 'A stylish merging of traditional Horological aesthetics with smart computing. Track activity metrics, notification logs, heart rate variability, and blood-oxygen content with standard 14-day hybrid battery charging.',
      short_description: 'An elegant hybrid smart-wearable in solid 316L brushed stainless steel chassis.',
      price: 189.00,
      sale_price: null,
      sku: 'MSS-SW-002',
      categories: ['Electronics', 'Wearables'],
      tags: ['Smartwatch', 'Steel', 'Fitness'],
      stock: 12,
      status: 'publish',
      visibility: 'visible',
      featured_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
      ],
      seo_title: 'Minimalist Stainless Steel Hybrid Smartwatch',
      seo_desc: 'Track fitness and messages on your wrist with our premium analog-hybrid stainless steel active tracker device.',
      variations: [
        { id: 'v102-1', name: 'Strap: Oyster Metal', price: 189.00, stock: 8, sku: 'MSS-SW-002-OYS' },
        { id: 'v102-2', name: 'Strap: Classic Chestnut Leather', price: 179.00, stock: 4, sku: 'MSS-SW-002-LTH' }
      ]
    },
    {
      id: 'prod-103',
      name: 'Vapor-Infused Walnut Wood Desk Organizer Studio',
      description: 'A beautifully sculpted single-block solid walnut wood organizer designed to manage mobile charge docks, analog writing implements, and cards. Each organizer is unique with custom natural grain variances.',
      short_description: 'Premium desk organizer hand-sculpted in dark solid walnut timber.',
      price: 89.00,
      sale_price: 69.99,
      sku: 'WWO-DS-003',
      categories: ['Home Office', 'Furniture'],
      tags: ['Minimalist', 'Wooden', 'Desk Setup'],
      stock: 3,
      status: 'publish',
      visibility: 'visible',
      featured_image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80'
      ],
      seo_title: 'Solid Walnut Wood Luxury Desktop Organizer Studio',
      seo_desc: 'Upgrade your workstation layout. Premium solid wood office trays and docking components.',
      variations: []
    },
    {
      id: 'prod-104',
      name: 'Ergonomic Breathable Soft Mesh Office Chair Pro',
      description: 'Designed for deep focus and long working cycles. Relieves physical spinal strain with self-adjusting lumbar support, tension controls, and full high-grade mesh ventilation.',
      short_description: 'Mesh office chair supporting posture correction with multi-angle adjustments.',
      price: 499.00,
      sale_price: null,
      sku: 'EOC-CH-004',
      categories: ['Furniture', 'Home Office'],
      tags: ['Ergonomic', 'Chair', 'Office'],
      stock: 22,
      status: 'draft',
      visibility: 'catalog',
      featured_image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80',
      images: [],
      seo_title: 'Ergonomic Support Office Chair | Office Studio Elite',
      seo_desc: 'Professional grade mesh workstation chair. Recline, lumbar, and armrest controls.',
      variations: []
    }
  ];

  const users: WooCommerceUser[] = [
    {
      id: 'usr-201',
      username: 'johndoe',
      email: 'john.doe@gmail.com',
      mobile: '+1 (555) 349-1102',
      role: 'customer',
      registration_date: '2025-11-12T14:22:00Z',
      total_orders: 8,
      wallet_balance: 145.50,
      status: 'active',
      order_history: [
        { orderId: 'ord-501', date: '2026-05-18T10:15:00Z', total: 249.99, status: 'completed' },
        { orderId: 'ord-504', date: '2026-05-22T19:30:00Z', total: 69.99, status: 'processing' }
      ],
      login_logs: [
        { timestamp: '2026-05-23T08:12:00Z', ip: '192.168.1.100', status: 'success', userAgent: 'Chrome on macOS' },
        { timestamp: '2026-05-22T14:45:00Z', ip: '192.168.1.100', status: 'success', userAgent: 'Chrome on macOS' }
      ]
    },
    {
      id: 'usr-202',
      username: 'karen_v',
      email: 'vendor.karen@gmail.com',
      mobile: '+1 (555) 782-9901',
      role: 'vendor',
      registration_date: '2025-06-03T09:10:00Z',
      total_orders: 14,
      wallet_balance: 1250.00,
      status: 'active',
      order_history: [
        { orderId: 'ord-502', date: '2026-05-20T11:40:00Z', total: 189.00, status: 'completed' }
      ],
      login_logs: [
        { timestamp: '2026-05-23T09:00:00Z', ip: '72.190.22.45', status: 'success', userAgent: 'Safari on iPhone' }
      ]
    },
    {
      id: 'usr-203',
      username: 'banned_user',
      email: 'banned_customer@badweb.com',
      mobile: '+1 (555) 123-4567',
      role: 'customer',
      registration_date: '2026-01-15T18:05:00Z',
      total_orders: 1,
      wallet_balance: 0.00,
      status: 'banned',
      order_history: [
        { orderId: 'ord-499', date: '2026-01-15T18:22:00Z', total: 89.00, status: 'cancelled' }
      ],
      login_logs: [
        { timestamp: '2026-05-21T11:00:00Z', ip: '203.0.113.111', status: 'failed', userAgent: 'Firefox on Linux (Blocked IP)' }
      ]
    }
  ];

  const coupons: WooCommerceCoupon[] = [
    {
      id: 'cp-301',
      code: 'WELCOME20',
      discount_type: 'percent',
      amount: 20,
      expiry_date: '2026-12-31',
      usage_limit: 500,
      usage_count: 142,
      min_amount: 50.00,
      user_specific: [],
      status: 'active'
    },
    {
      id: 'cp-302',
      code: 'FLAT50OFF',
      discount_type: 'fixed',
      amount: 50.00,
      expiry_date: '2026-08-30',
      usage_limit: 100,
      usage_count: 99,
      min_amount: 200.00,
      user_specific: [],
      status: 'active'
    },
    {
      id: 'cp-303',
      code: 'EXPIRED10',
      discount_type: 'percent',
      amount: 10,
      expiry_date: '2026-04-30',
      usage_limit: 50,
      usage_count: 50,
      min_amount: 10.00,
      user_specific: [],
      status: 'expired'
    }
  ];

  const orders: WooCommerceOrder[] = [
    {
      id: 'ord-501',
      order_number: 'WC-2026-001',
      customer_name: 'John Doe',
      customer_email: 'john.doe@gmail.com',
      date_created: '2026-05-18T10:15:00Z',
      status: 'completed',
      total: 249.99,
      items: [
        { id: 'item-1', name: 'Wireless Noise-Canceling Headphones Professional (Obsidian Black)', quantity: 1, price: 249.99 }
      ]
    },
    {
      id: 'ord-502',
      order_number: 'WC-2026-002',
      customer_name: 'Karen V',
      customer_email: 'vendor.karen@gmail.com',
      date_created: '2026-05-20T11:40:00Z',
      status: 'completed',
      total: 189.00,
      items: [
        { id: 'item-2', name: 'Minimalist Stainless Steel Smart Wearable Watch', quantity: 1, price: 189.00 }
      ]
    },
    {
      id: 'ord-503',
      order_number: 'WC-2026-003',
      customer_name: 'Sabrina Vance',
      customer_email: 'sabrina.v@yahoo.com',
      date_created: '2026-05-21T03:05:00Z',
      status: 'pending',
      total: 399.00,
      items: [
        { id: 'item-3', name: 'Ergonomic Breathable Soft Mesh Office Chair Pro', quantity: 1, price: 399.00 }
      ]
    },
    {
      id: 'ord-504',
      order_number: 'WC-2026-004',
      customer_name: 'John Doe',
      customer_email: 'john.doe@gmail.com',
      date_created: '2026-05-22T19:30:00Z',
      status: 'processing',
      total: 69.99,
      items: [
        { id: 'item-4', name: 'Vapor-Infused Walnut Wood Desk Organizer Studio', quantity: 1, price: 69.99 }
      ]
    }
  ];

  const settings: PanelSettings = {
    siteUrl: 'https://kalavogue.com/',
    consumerKey: 'ck_a79c24929c6ea85815f8042131fa6ff9d944bbd2',
    consumerSecret: 'cs_fd8323c761722696e55b84eff0adea518e36074e',
    apiEndpoint: '/wp-json/wc/v3',
    jwtSecret: 'woo-admin-jwt-top-secret-key-123456789-abcde',
    apiTimeout: 10000,
    apiHeaders: 'Content-Type: application/json',
    logo: '✨ Kalavogue Portal',
    theme: 'dark',
    sidebarCollapsed: false,
    notificationsEnabled: true,
    emailNotifications: true,
    sessionTimeout: 60,
    language: 'English',
    currency: 'INR',
    ipWhitelist: '127.0.0.1, 192.168.1.100',
    rateLimiting: true,
    loginAttemptsLimit: 5,
    twoFactorEnabled: false
  };

  const logs: SystemLog[] = [
    {
      id: 'log-1',
      type: 'auth',
      severity: 'info',
      message: 'Initial workspace user database seeded successfully',
      timestamp: '2026-05-23T09:00:00Z',
      admin: 'System'
    },
    {
      id: 'log-2',
      type: 'auth',
      severity: 'info',
      message: 'Admin account logged in from IP 192.168.1.100',
      timestamp: '2026-05-23T09:10:00Z',
      admin: 'admin',
      ip: '192.168.1.100'
    },
    {
      id: 'log-3',
      type: 'product',
      severity: 'info',
      message: 'Product "Wireless Noise-Canceling Headphones Professional" synchronized',
      timestamp: '2026-05-23T09:20:00Z',
      admin: 'admin'
    }
  ];

  const adminNotes = [
    {
      id: 'note-1',
      content: '⚡ Remember to review inventory for "Vapor-Infused Walnut Wood Desk Organizer Studio" as stock is critical (only 3 remaining). Request stock re-evaluation from vendor.\n\n📢 Product variations updated for upcoming Summer Sale coupon WELCOME20 clearance push.',
      updatedAt: '2026-05-23T09:44:00Z',
      author: 'admin'
    }
  ];

  return {
    admins,
    products,
    users,
    coupons,
    orders,
    settings,
    logs,
    adminNotes
  };
}

// Low-level write and read triggers
export class LocalDB {
  private static data: DatabaseSchema | null = null;

  static initialize(): DatabaseSchema {
    if (this.data) return this.data;

    // Build directory if not exist
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        if (this.data) {
          let updated = false;
          if (!this.data.settings.currency) {
            this.data.settings.currency = 'INR';
            updated = true;
          }
          if (this.data.settings.siteUrl.includes('myshop.com') || this.data.settings.consumerKey.includes('ck_demo_woo')) {
            this.data.settings.siteUrl = 'https://kalavogue.com/';
            this.data.settings.consumerKey = 'ck_a79c24929c6ea85815f8042131fa6ff9d944bbd2';
            this.data.settings.consumerSecret = 'cs_fd8323c761722696e55b85eff0adea518e36074e';
            this.data.settings.logo = '✨ Kalavogue Portal';
            updated = true;
          }
          if (updated) {
            this.save();
          }
        }
      } catch (err) {
        console.error('Failed reading DB file, reseeding:', err);
        this.data = createSeedData();
        this.save();
      }
    } else {
      this.data = createSeedData();
      this.save();
    }

    return this.data!;
  }

  static get(): DatabaseSchema {
    return this.initialize();
  }

  static save(): void {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to DB file:', err);
    }
  }

  static log(
    type: SystemLog['type'],
    severity: SystemLog['severity'],
    message: string,
    admin: string,
    ip?: string
  ) {
    const db = this.get();
    const newLog: SystemLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      admin,
      ip
    };
    db.logs.unshift(newLog);
    // Limit log length to 1000 items
    if (db.logs.length > 1000) {
      db.logs = db.logs.slice(0, 1000);
    }
    this.save();
  }
}
