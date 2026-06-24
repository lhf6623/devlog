import { marked } from 'marked';
import type { WorkRecord } from './types';

// ============================================================
// 时间工具
// ============================================================

/** 获取本周一的 Date（00:00:00） */
export function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 周日归到上周
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 解析更新时间为 Date */
export function parseDate(record: WorkRecord): Date {
  // 格式可能是 "6/24 10:00" 或 ISO "2026-06-24T10:00:00"
  const d = new Date(record.updated_at);
  if (!isNaN(d.getTime())) return d;
  // fallback: 尝试解析 M/D HH:mm
  const match = record.updated_at.match(/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if (match) {
    const now = new Date();
    return new Date(now.getFullYear(), +match[1] - 1, +match[2], +match[3], +match[4]);
  }
  return new Date(0);
}

export function isThisWeek(record: WorkRecord): boolean {
  const d = parseDate(record);
  if (d.getTime() === 0) return false;
  const monday = getMonday();
  return d >= monday;
}

export function isLastWeek(record: WorkRecord): boolean {
  const d = parseDate(record);
  if (d.getTime() === 0) return false;
  const thisMonday = getMonday();
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  return d >= lastMonday && d < thisMonday;
}

export function isEarlier(record: WorkRecord): boolean {
  const d = parseDate(record);
  if (d.getTime() === 0) return false;
  const thisMonday = getMonday();
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  return d < lastMonday;
}

/** 格式化当前时间为 M/D HH:mm */
export function nowTime(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 智能时间格式化：今天→时分，本周→周几，本月→几号，今年→月日，其他→年月日 */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // fallback: M/D HH:mm
    const match = dateStr.match(/(\d+)\/(\d+)\s+(\d+):(\d+)/);
    if (match) {
      const now = new Date();
      d.setFullYear(now.getFullYear(), +match[1] - 1, +match[2]);
      d.setHours(+match[3], +match[4], 0, 0);
    } else {
      return dateStr;
    }
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / 86400000);

  // 今天
  if (diffDays === 0) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  // 本周内（过去7天内且在本周）
  const thisMonday = getMonday();
  if (targetDay >= thisMonday) {
    return WEEKDAYS[d.getDay()];
  }
  // 本月
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
    return `${d.getDate()}日`;
  }
  // 今年
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  // 更早
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 格式化为 ISO 字符串 */
export function nowISO(): string {
  return new Date().toISOString();
}

// ============================================================
// Markdown 渲染
// ============================================================

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

// ============================================================
// ID 生成
// ============================================================

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// HTML 转义
// ============================================================

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// 内容预览（取第一段非标题文字）
// ============================================================

export function contentPreview(content: string, maxLen = 60): string {
  const firstLine = content.trim().split('\n').find(line => line.trim() && !line.startsWith('#')) || '暂无内容';
  return firstLine.length > maxLen ? firstLine.slice(0, maxLen) + '…' : firstLine;
}
