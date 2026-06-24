// ============================================================
// DevLog 类型定义
// ============================================================

export interface WorkRecord {
  id: string;
  title: string;
  content: string;
  status: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface AppData {
  records: WorkRecord[];
  categories: string[];
}

export interface Filter {
  type: 'time' | 'status' | 'category';
  value: string;
}

export type StatusKey = 'pending' | 'in_progress' | 'completed' | 'archived';

export interface StatusInfo {
  label: string;
  class: string;
  color: string;
}

export const STATUS_MAP: Record<StatusKey, StatusInfo> = {
  pending:    { label: '待处理',   class: 'status-pending',    color: '#f59e0b' },
  in_progress:{ label: '进行中',   class: 'status-in-progress', color: '#6366f1' },
  completed:  { label: '本周完成', class: 'status-completed',  color: '#22c55e' },
  archived:   { label: '已归档',   class: 'status-archived',   color: '#9ca3af' },
};

export const TIME_LABELS: Record<string, string> = {
  this_week: '本周',
  last_week: '上周',
  earlier:   '更早',
  all:       '全部',
};

export const TIME_KEYS = ['this_week', 'last_week', 'earlier', 'all'] as const;

/** 安全获取状态信息（status 为 string 时的索引辅助） */
export function getStatusInfo(status: string): StatusInfo {
  return STATUS_MAP[status as StatusKey] ?? { label: status, class: '', color: '#9ca3af' };
}
