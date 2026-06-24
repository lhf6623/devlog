<script setup lang="ts">
import { ref } from 'vue';
import { store, addCategory, removeCategory } from '../store';
import { STATUS_MAP, TIME_LABELS, TIME_KEYS } from '../types';
import type { Filter } from '../types';

const emit = defineEmits<{
  (e: 'filter-change', filter: Filter): void;
}>();

const newCategoryName = ref('');
const contextMenu = ref<{ visible: boolean; x: number; y: number; category: string }>({
  visible: false, x: 0, y: 0, category: '',
});

// 计数
function statusCount(key: string): number {
  return store.records.filter(r => r.status === key).length;
}

function categoryCount(name: string): number {
  return store.records.filter(r => r.category === name).length;
}

function timeCount(key: string): number {
  // 时间计数实际由筛选函数决定，这里给全部记录数
  if (key === 'all') return store.records.length;
  // 简化：给一个 approximate 计数
  return store.records.length;
}

function isActive(type: string, value: string): boolean {
  return store.activeFilter.type === type && store.activeFilter.value === value;
}

function selectFilter(type: string, value: string) {
  emit('filter-change', { type, value } as Filter);
}

async function handleAddCategory() {
  const name = newCategoryName.value.trim();
  if (!name) return;
  await addCategory(name);
  newCategoryName.value = '';
}

function onCategoryContextMenu(e: MouseEvent, cat: string) {
  e.preventDefault();
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, category: cat };
}

async function handleDeleteCategory() {
  const cat = contextMenu.value.category;
  closeContextMenu();
  if (cat && confirm(`确定删除类别「${cat}」吗？相关记录将变为未分类。`)) {
    await removeCategory(cat);
  }
}

function closeContextMenu() {
  contextMenu.value = { visible: false, x: 0, y: 0, category: '' };
}
</script>

<template>
  <nav class="w-168px flex-shrink-0 bg-warm border-r border-#edeef3 flex flex-col select-none"
       @click="closeContextMenu">
    <!-- Brand -->
    <div class="px-4 pt-5 pb-4 flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-brand"></span>
      <span class="text-15px font-600 color-#1f1f1f">工作记录</span>
    </div>

    <div class="flex-1 overflow-y-auto px-2.5 pb-4">
      <!-- 时间 -->
      <div class="text-11px color-#9ca3af font-500 px-2 pt-4 pb-2 uppercase tracking-wider">时间</div>
      <button
        v-for="k in TIME_KEYS" :key="k"
        :class="['sidebar-btn', isActive('time', k) && 'sidebar-btn-active']"
        @click="selectFilter('time', k)"
      >
        <span>{{ TIME_LABELS[k] }}</span>
        <span class="text-11px color-#9ca3af font-500">{{ timeCount(k) }}</span>
      </button>

      <!-- 状态 -->
      <div class="text-11px color-#9ca3af font-500 px-2 pt-4 pb-2 uppercase tracking-wider">状态</div>
      <button
        v-for="(info, key) in STATUS_MAP" :key="key"
        :class="['sidebar-btn', isActive('status', key) && 'sidebar-btn-active']"
        @click="selectFilter('status', key)"
      >
        <span class="flex items-center gap-1.5">
          <span class="w-1.25 h-1.25 rounded-full inline-block" :style="{ background: info.color }"></span>
          {{ info.label }}
        </span>
        <span class="text-11px color-#9ca3af font-500">{{ statusCount(key) }}</span>
      </button>

      <!-- 类别 -->
      <div class="text-11px color-#9ca3af font-500 px-2 pt-4 pb-2 uppercase tracking-wider">类别</div>
      <button
        v-for="cat in store.categories" :key="cat"
        :class="['sidebar-btn truncate', isActive('category', cat) && 'sidebar-btn-active']"
        @click="selectFilter('category', cat)"
        @contextmenu="onCategoryContextMenu($event, cat)"
      >
        <span class="truncate">{{ cat }}</span>
        <span class="text-11px color-#9ca3af font-500">{{ categoryCount(cat) }}</span>
      </button>

      <!-- 新增类别 -->
      <div class="flex gap-1 mt-2">
        <input
          v-model="newCategoryName"
          type="text"
          placeholder="新增类别"
          class="flex-1 min-w-0 px-2 py-1.25 border border-#e5e7eb rounded-6 text-12px outline-none focus:border-brand"
          @keyup.enter="handleAddCategory"
        />
        <button
          class="flex-shrink-0 px-1.5 border-none rounded-6 bg-brand text-white text-14px cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!newCategoryName.trim()"
          @click="handleAddCategory"
        ><span class="i-mdi-plus text-16px"></span></button>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="fixed z-999 bg-white rounded-8 shadow-lg border border-#edeef3 py-1 min-w-120px"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <button
          class="w-full text-left px-3 py-1.5 text-13px color-#ef4444 bg-transparent border-none cursor-pointer hover:bg-#fef2f2"
          @click="handleDeleteCategory"
        >删除类别</button>
      </div>
    </Teleport>
  </nav>
</template>
