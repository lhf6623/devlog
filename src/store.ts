import { reactive } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { AppData, WorkRecord, Filter } from './types';
import { generateId, nowISO } from './utils';

// ============================================================
// 全局状态
// ============================================================

export interface Store {
  records: WorkRecord[];
  categories: string[];
  activeFilter: Filter;
  selectedId: string | null;
  searchKeyword: string;
  loading: boolean;
}

export const store = reactive<Store>({
  records: [],
  categories: [],
  activeFilter: { type: 'time', value: 'this_week' },
  selectedId: null,
  searchKeyword: '',
  loading: false,
});

// ============================================================
// 数据操作
// ============================================================

export async function loadAll(): Promise<void> {
  store.loading = true;
  try {
    const data = await invoke<AppData>('load_data');
    store.records = data.records;
    store.categories = data.categories;
    if (store.records.length > 0 && !store.selectedId) {
      store.selectedId = store.records[0].id;
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  } finally {
    store.loading = false;
  }
}

export async function createRecord(): Promise<void> {
  const record: WorkRecord = {
    id: generateId(),
    title: '',
    content: '',
    status: 'pending',
    category: '',
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  try {
    const data = await invoke<AppData>('save_record', { record });
    applyData(data);
    store.selectedId = record.id;
  } catch (e) {
    console.error('Failed to create record:', e);
  }
}

export async function updateRecord(id: string, changes: Partial<WorkRecord>): Promise<void> {
  const idx = store.records.findIndex(r => r.id === id);
  if (idx === -1) return;
  const record = { ...store.records[idx], ...changes, updated_at: nowISO() };
  try {
    const data = await invoke<AppData>('save_record', { record });
    applyData(data);
  } catch (e) {
    console.error('Failed to save record:', e);
  }
}

export async function removeRecord(id: string): Promise<void> {
  try {
    const data = await invoke<AppData>('delete_record', { id });
    applyData(data);
    if (store.selectedId === id) {
      store.selectedId = store.records.length > 0 ? store.records[0].id : null;
    }
  } catch (e) {
    console.error('Failed to delete record:', e);
  }
}

export async function addCategory(name: string): Promise<void> {
  try {
    const data = await invoke<AppData>('add_category', { name });
    applyData(data);
  } catch (e) {
    console.error('Failed to add category:', e);
  }
}

export async function removeCategory(name: string): Promise<void> {
  try {
    const data = await invoke<AppData>('delete_category', { name });
    applyData(data);
  } catch (e) {
    console.error('Failed to delete category:', e);
  }
}

function applyData(data: AppData): void {
  store.records = data.records;
  store.categories = data.categories;
}
