import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDuplicateBooking, parseBookingDateTime, formatDuplicateMessage } from './duplicateBookingCheck';

// Mock Firebase
const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: () => mockGetDocs(),
}));

vi.mock('../firebase/config', () => ({
  db: {},
}));

vi.mock('./logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('duplicateBookingCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseBookingDateTime', () => {
    it('should parse standard booking datetime', () => {
      const result = parseBookingDateTime('2026-02-07', '14:00');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(7);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(0);
    });

    it('should handle midnight (24:00) as next day 00:00', () => {
      const result = parseBookingDateTime('2026-02-07', '24:00');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(8); // Next day
      expect(result.getHours()).toBe(0);
    });

    it('should parse noon correctly', () => {
      const result = parseBookingDateTime('2026-02-07', '12:00');
      expect(result.getHours()).toBe(12);
    });

    it('should parse evening time correctly', () => {
      const result = parseBookingDateTime('2026-02-07', '20:00');
      expect(result.getHours()).toBe(20);
    });
  });

  describe('formatDuplicateMessage', () => {
    const mockT = (key, fallback) => fallback;

    it('should format same_date duplicate message', () => {
      const existingBooking = { date: '2026-02-07', time: '14:00' };
      const result = formatDuplicateMessage('same_date', existingBooking, mockT);

      expect(result.title).toBe('Booking Already Exists');
      expect(result.message).toContain('pending booking');
    });

    it('should format same_vehicle_24h duplicate message', () => {
      const existingBooking = { date: '2026-02-07', time: '14:00' };
      const result = formatDuplicateMessage('same_vehicle_24h', existingBooking, mockT);

      expect(result.title).toBe('Recent Booking Found');
      expect(result.message).toContain('same vehicle');
    });

    it('should format generic duplicate message', () => {
      const result = formatDuplicateMessage('unknown_type', {}, mockT);

      expect(result.title).toBe('Duplicate Booking');
      expect(result.message).toContain('similar booking');
    });
  });

  describe('checkDuplicateBooking', () => {
    describe('when no user identification provided', () => {
      it('should return no duplicate when no userId, sessionId, or phone', async () => {
        const result = await checkDuplicateBooking({
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(false);
        expect(result.duplicateType).toBeNull();
        expect(result.existingBooking).toBeNull();
      });
    });

    describe('when no existing bookings found', () => {
      it('should return no duplicate for authenticated user', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: true,
          docs: [],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(false);
        expect(result.duplicateType).toBeNull();
      });

      it('should return no duplicate for guest with phone', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: true,
          docs: [],
        });

        const result = await checkDuplicateBooking({
          guestPhone: '501234567',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(false);
      });

      it('should return no duplicate for guest with session ID', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: true,
          docs: [],
        });

        const result = await checkDuplicateBooking({
          guestSessionId: 'session-abc',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(false);
      });
    });

    describe('same date duplicate detection', () => {
      it('should detect duplicate booking on same date', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-07',
                time: '10:00',
                vehicleType: 'suv', // Different vehicle
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(true);
        expect(result.duplicateType).toBe('same_date');
        expect(result.existingBooking.date).toBe('2026-02-07');
      });

      it('should not flag as duplicate when dates differ', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-08', // Different date
                time: '14:00',
                vehicleType: 'sedan',
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        // Should check for 24h window instead
        expect(result.duplicateType).not.toBe('same_date');
      });
    });

    describe('same vehicle within 24 hours detection', () => {
      it('should detect same vehicle booked within 24 hours', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-08', // Next day
                time: '10:00', // Less than 24h after 2026-02-07 14:00
                vehicleType: 'sedan',
                vehicleSize: null,
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          vehicleSize: null,
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(true);
        expect(result.duplicateType).toBe('same_vehicle_24h');
      });

      it('should not flag different vehicle types as duplicate', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-08',
                time: '10:00',
                vehicleType: 'suv', // Different vehicle type
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(false);
      });

      it('should detect same vehicle with matching size', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-08',
                time: '10:00',
                vehicleType: 'caravan',
                vehicleSize: 'medium',
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'caravan',
          vehicleSize: 'medium',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(true);
        expect(result.duplicateType).toBe('same_vehicle_24h');
      });

      it('should not flag same vehicle type with different size', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-08',
                time: '10:00',
                vehicleType: 'caravan',
                vehicleSize: 'large', // Different size
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'caravan',
          vehicleSize: 'medium',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(false);
      });

      it('should not flag bookings more than 24 hours apart', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-09', // 2 days later
                time: '14:00',
                vehicleType: 'sedan',
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(result.hasDuplicate).toBe(false);
      });
    });

    describe('phone number formatting', () => {
      it('should handle phone without country code', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: true,
          docs: [],
        });

        // This should format phone to +971501234567
        await checkDuplicateBooking({
          guestPhone: '501234567',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(mockGetDocs).toHaveBeenCalled();
      });

      it('should handle phone with country code', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: true,
          docs: [],
        });

        await checkDuplicateBooking({
          guestPhone: '+971501234567',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(mockGetDocs).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should fail open on Firestore error', async () => {
        mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'));

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        // Should fail open - allow booking to proceed
        expect(result.hasDuplicate).toBe(false);
        expect(result.duplicateType).toBeNull();
      });
    });

    describe('userId handling', () => {
      it('should treat userId "guest" as needing other identification', async () => {
        const result = await checkDuplicateBooking({
          userId: 'guest',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        // No guestPhone or guestSessionId provided
        expect(result.hasDuplicate).toBe(false);
      });

      it('should use guestPhone when userId is "guest"', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: true,
          docs: [],
        });

        const result = await checkDuplicateBooking({
          userId: 'guest',
          guestPhone: '501234567',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        expect(mockGetDocs).toHaveBeenCalled();
        expect(result.hasDuplicate).toBe(false);
      });
    });

    describe('priority of duplicate checks', () => {
      it('should prioritize same_date over same_vehicle_24h', async () => {
        mockGetDocs.mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'booking-1',
              data: () => ({
                date: '2026-02-07', // Same date AND same vehicle
                time: '10:00',
                vehicleType: 'sedan',
                status: 'pending',
              }),
            },
          ],
        });

        const result = await checkDuplicateBooking({
          userId: 'user-123',
          vehicleType: 'sedan',
          date: '2026-02-07',
          time: '14:00',
        });

        // Should report same_date first
        expect(result.duplicateType).toBe('same_date');
      });
    });
  });
});
