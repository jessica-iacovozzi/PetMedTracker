import "@testing-library/jest-dom";

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';

// Mock Request and Response for Next.js server components
global.Request = class Request {
  constructor(input, init = {}) {
    // Use Object.defineProperty to create a proper read-only url property
    Object.defineProperty(this, 'url', {
      value: typeof input === 'string' ? input : input.url,
      writable: false,
      enumerable: true,
      configurable: false
    });
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body || null;
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  }
};

global.Headers = class Headers extends Map {
  constructor(init) {
    super();
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }
  
  get(name) {
    return super.get(name.toLowerCase());
  }
  
  set(name, value) {
    return super.set(name.toLowerCase(), value);
  }
  
  has(name) {
    return super.has(name.toLowerCase());
  }
  
  delete(name) {
    return super.delete(name.toLowerCase());
  }
};

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    get: jest.fn(() => ({ value: "" })),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => new Map()),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock Supabase client
jest.mock("./supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      updateUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  }),
}));

// Mock server-side Supabase
jest.mock("./supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

// Mock window.location - safely handle existing property
const mockLocation = {
  href: "http://localhost:3000",
  origin: "http://localhost:3000",
  protocol: "http:",
  host: "localhost:3000",
  hostname: "localhost",
  port: "3000",
  pathname: "/",
  search: "",
  hash: "",
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Check if location is configurable before trying to redefine it
const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
if (locationDescriptor && locationDescriptor.configurable) {
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  });
} else {
  // If not configurable, try to mock individual properties
  Object.keys(mockLocation).forEach(key => {
    try {
      if (typeof window.location[key] === 'function') {
        window.location[key] = mockLocation[key];
      }
    } catch (e) {
      // Silently ignore if property cannot be set
    }
  });
}

// Mock window.history to prevent navigation errors
const mockHistory = {
  pushState: jest.fn(),
  replaceState: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  go: jest.fn(),
  length: 1,
  state: null,
};

try {
  Object.defineProperty(window, 'history', {
    value: mockHistory,
    writable: true,
  });
} catch (e) {
  // If history cannot be redefined, mock individual methods
  Object.keys(mockHistory).forEach(key => {
    try {
      if (typeof window.history[key] === 'function') {
        window.history[key] = mockHistory[key];
      }
    } catch (err) {
      // Silently ignore
    }
  });
}

// Mock Navigation API if it exists
if (typeof window.navigation === 'undefined') {
  Object.defineProperty(window, 'navigation', {
    value: {
      navigate: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      reload: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    writable: true,
  });
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock pointer capture methods
Element.prototype.hasPointerCapture = jest.fn(() => false);
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();

// Mock scrollIntoView method
Element.prototype.scrollIntoView = jest.fn();
