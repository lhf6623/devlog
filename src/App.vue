<script setup lang="ts">
import { computed, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import RecordList from './components/RecordList.vue';
import DetailPanel from './components/DetailPanel.vue';
import { store, loadAll, createRecord, updateRecord, removeRecord } from './store';
import type { WorkRecord, Filter } from './types';
import { isThisWeek, isLastWeek, isEarlier } from './utils';

// ============================================================
// 启动时从 Rust 后端加载数据
// ============================================================
onMounted(() => {
  loadAll();
});

// ============================================================
// 筛选逻辑
// ============================================================
const filteredRecords = computed<WorkRecord[]>(() => {
  let list = store.records;

  // 搜索（忽略筛选）
  if (store.searchKeyword) {
    const kw = store.searchKeyword.toLowerCase();
    list = list.filter(r =>
      r.title.toLowerCase().includes(kw) ||
      r.content.toLowerCase().includes(kw) ||
      r.category.toLowerCase().includes(kw)
    );
  } else {
    // 按筛选条件过滤
    const { type, value } = store.activeFilter;
    if (type === 'status') {
      list = list.filter(r => r.status === value);
    } else if (type === 'category') {
      list = list.filter(r => r.category === value);
    } else if (type === 'time') {
      if (value === 'this_week') {
        list = list.filter(r => isThisWeek(r));
      } else if (value === 'last_week') {
        list = list.filter(r => isLastWeek(r));
      } else if (value === 'earlier') {
        list = list.filter(r => isEarlier(r));
      }
      // 'all' — no filter
    }
  }

  // 按更新时间倒序
  return [...list].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
});

// ============================================================
// 当前选中的记录
// ============================================================
const selectedRecord = computed<WorkRecord | null>(() => {
  if (!store.selectedId) return null;
  return store.records.find(r => r.id === store.selectedId) ?? null;
});

// ============================================================
// 事件处理
// ============================================================
function onFilterChange(filter: Filter) {
  store.activeFilter = filter;
  store.searchKeyword = '';
}

function onSearch(keyword: string) {
  store.searchKeyword = keyword;
}

function onSelect(id: string) {
  store.selectedId = id;
}

async function onCreate() {
  await createRecord();
}

async function onUpdate(id: string, changes: Partial<WorkRecord>) {
  await updateRecord(id, changes);
}

async function onDelete(id: string) {
  await removeRecord(id);
}
</script>

<template>
  <div class="flex h-screen">
    <Sidebar @filter-change="onFilterChange" />
    <RecordList
      :records="filteredRecords"
      :selected-id="store.selectedId"
      @select="onSelect"
      @create="onCreate"
      @search="onSearch"
    />
    <DetailPanel
      :record="selectedRecord"
      :categories="store.categories"
      @update="onUpdate"
      @delete="onDelete"
      @save="(id: string) => onUpdate(id, {})"
    />
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f8f7fa;
  color: #1f1f1f;
  overflow: hidden;
}
#app {
  height: 100%;
}
</style>
