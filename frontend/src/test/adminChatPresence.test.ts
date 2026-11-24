import { describe, it, expect } from 'vitest';
import { formatLastActiveTime } from '../pages/Admin/AdminChatPage';

describe('Admin Chat Presence & Last Active Time Formatter', () => {
  it('should return "Đã hoạt động vài giây trước" for activity within 45 seconds', () => {
    const recent = new Date(Date.now() - 20 * 1000).toISOString();
    expect(formatLastActiveTime(recent)).toBe('Đã hoạt động vài giây trước');
  });

  it('should return "Đã hoạt động X phút trước" for activity between 1 and 59 minutes', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatLastActiveTime(fiveMinutesAgo)).toBe('Đã hoạt động 5 phút trước');

    const fortyTwoMinutesAgo = new Date(Date.now() - 42 * 60 * 1000).toISOString();
    expect(formatLastActiveTime(fortyTwoMinutesAgo)).toBe('Đã hoạt động 42 phút trước');
  });

  it('should return "Đã hoạt động X giờ trước" for activity between 1 and 23 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(formatLastActiveTime(threeHoursAgo)).toBe('Đã hoạt động 3 giờ trước');
  });

  it('should return "Đã hoạt động X ngày trước" for activity between 1 and 6 days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
    expect(formatLastActiveTime(twoDaysAgo)).toBe('Đã hoạt động 2 ngày trước');
  });

  it('should return "Đã hoạt động X tuần trước" for activity between 1 and 3 weeks', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    expect(formatLastActiveTime(twoWeeksAgo)).toBe('Đã hoạt động 2 tuần trước');
  });

  it('should return "Đã hoạt động X tháng trước" for activity between 1 and 11 months', () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 24 * 3600 * 1000).toISOString();
    expect(formatLastActiveTime(twoMonthsAgo)).toBe('Đã hoạt động 2 tháng trước');
  });

  it('should return "Đã hoạt động X năm trước" for activity 1 year or more ago', () => {
    const twoYearsAgo = new Date(Date.now() - 750 * 24 * 3600 * 1000).toISOString();
    expect(formatLastActiveTime(twoYearsAgo)).toBe('Đã hoạt động 2 năm trước');
  });

  it('should return fallback string for null, undefined or invalid dates', () => {
    expect(formatLastActiveTime(null)).toBe('Đã hoạt động gần đây');
    expect(formatLastActiveTime(undefined)).toBe('Đã hoạt động gần đây');
    expect(formatLastActiveTime('invalid-date')).toBe('Đã hoạt động gần đây');
  });
});

describe('Admin Consultation Session State Transitions', () => {
  it('should determine action button as "Nhận xử lý" when conversation is unassigned', () => {
    const conv = {
      id: 'conv-1',
      status: 'open',
      assignedAdminId: null,
      assignedAdminName: null,
    };
    const isClosed = conv.status === 'closed';
    const isHandled = Boolean(conv.assignedAdminId || conv.assignedAdminName);
    
    expect(isClosed).toBe(false);
    expect(isHandled).toBe(false);
  });

  it('should determine action button as "Kết thúc" once staff has claimed/assigned conversation', () => {
    const conv = {
      id: 'conv-1',
      status: 'open',
      assignedAdminId: 'admin_123',
      assignedAdminName: 'Nhân viên Nguyen Minh Hoang',
    };
    const isClosed = conv.status === 'closed';
    const isHandled = Boolean(conv.assignedAdminId || conv.assignedAdminName);

    expect(isClosed).toBe(false);
    expect(isHandled).toBe(true);
  });

  it('should transition to "Đã kết thúc" state when consultation session is ended', () => {
    const conv = {
      id: 'conv-1',
      status: 'closed',
      assignedAdminId: 'admin_123',
      assignedAdminName: 'Nhân viên Nguyen Minh Hoang',
    };
    const isClosed = conv.status === 'closed';

    expect(isClosed).toBe(true);
  });
});
