const {
  customSecurity,
  escapeSQLInput
} = require('../../middleware/security');

describe('Security Middleware Tests', () => {
  describe('customSecurity', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
        url: '/test'
      };
      res = {
        removeHeader: jest.fn(),
        setHeader: jest.fn(),
        redirect: jest.fn()
      };
      next = jest.fn();
    });

    it('should set security headers', () => {
      customSecurity(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      expect(next).toHaveBeenCalled();
    });

    it('should remove X-Powered-By header', () => {
      customSecurity(req, res, next);

      expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    });

    it('should enforce HTTPS in production', () => {
      process.env.NODE_ENV = 'production';
      req.headers = {
        'x-forwarded-proto': 'http',
        host: 'example.com'
      };

      customSecurity(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/test');
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow HTTPS in production', () => {
      process.env.NODE_ENV = 'production';
      req.headers = {
        'x-forwarded-proto': 'https',
        host: 'example.com'
      };

      customSecurity(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should allow HTTP in development', () => {
      process.env.NODE_ENV = 'development';
      req.headers = {
        'x-forwarded-proto': 'http',
        host: 'localhost'
      };

      customSecurity(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('escapeSQLInput', () => {
    it('should escape single quotes', () => {
      const input = "SELECT * FROM users WHERE name = 'John'";
      const result = escapeSQLInput(input);
      expect(result).toBe("SELECT * FROM users WHERE name = \\'John\\'");
    });

    it('should escape double quotes', () => {
      const input = 'SELECT * FROM users WHERE name = "John"';
      const result = escapeSQLInput(input);
      expect(result).toBe('SELECT * FROM users WHERE name = \\"John\\"');
    });

    it('should escape semicolons', () => {
      const input = "SELECT * FROM users; DROP TABLE users;";
      const result = escapeSQLInput(input);
      expect(result).toBe("SELECT * FROM users\\; DROP TABLE users\\;");
    });

    it('should escape backslashes', () => {
      const input = "SELECT * FROM users WHERE path = 'C:\\Users'";
      const result = escapeSQLInput(input);
      expect(result).toBe("SELECT * FROM users WHERE path = \\'C:\\\\Users\\'");
    });

    it('should handle non-string input', () => {
      expect(escapeSQLInput(123)).toBe(123);
      expect(escapeSQLInput(null)).toBe(null);
      expect(escapeSQLInput(undefined)).toBe(undefined);
      expect(escapeSQLInput(true)).toBe(true);
    });

    it('should handle empty string', () => {
      expect(escapeSQLInput('')).toBe('');
    });

    it('should handle complex SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --";
      const result = escapeSQLInput(input);
      expect(result).toBe("\\'\\; DROP TABLE users\\; --");
    });
  });
});
