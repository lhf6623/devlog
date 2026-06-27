<script setup lang="ts">
import { ref } from 'vue'
import { useLogStore } from '../store/logStore'
import Dropdown from './Dropdown.vue'
import TagBadge from './TagBadge.vue'

const store = useLogStore()
const hoveredId = ref<string | null>(null)

function formatDate(iso: string): string {
  const d = new Date(iso)
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function handleToggleComplete(id: string) {
  store.toggleComplete(id)
}

function handleDelete(id: string) {
  if (confirm('确定要删除这条记录吗？')) {
    store.deleteItem(id)
  }
}
</script>

<template>
  <div class="sidebar">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="store.searchQuery"
        type="text"
        placeholder="搜索标题或内容..."
        class="search-input"
      />
    </div>

    <!-- 记录列表 -->
    <div class="list">
      <div
        v-for="item in store.filteredItems"
        :key="item.id"
        class="list-item"
        :class="{ active: item.id === store.currentItemId, completed: item.completed }"
        @click="store.selectItem(item.id)"
        @mouseenter="hoveredId = item.id"
        @mouseleave="hoveredId = null"
      >
        <div class="list-item-header">
          <span class="title">{{ item.title }}</span>
          <Dropdown align="right" class="menu-dropdown">
            <template #trigger>
              <button v-show="hoveredId === item.id" class="menu-btn" title="更多操作">
                <span class="i-mdi-dots-vertical"></span>
              </button>
            </template>
            <div class="dropdown-menu">
              <button class="menu-item" @click="handleToggleComplete(item.id)">
                {{ item.completed ? '取消已办' : '标记已办' }}
              </button>
              <button class="menu-item danger" @click="handleDelete(item.id)">
                删除
              </button>
            </div>
          </Dropdown>
        </div>
        <div class="list-item-meta">
          <span class="date">{{ formatDate(item.updatedAt) }}</span>
          <div class="tags">
            <TagBadge
              v-for="tag in item.tags.slice(0, 3)"
              :key="tag"
              :name="tag"
              :color="store.getTagColor(tag)"
              size="sm"
            />
          </div>
        </div>
      </div>

      <div v-if="store.filteredItems.length === 0" class="empty">
        {{ store.items.length === 0 ? '暂无记录，点击下方按钮创建' : '没有匹配的记录' }}
      </div>
    </div>

    <!-- 新建按钮 -->
    <button class="create-btn" @click="store.createItem()">
      <span class="i-mdi-plus"></span>
      新建记录
    </button>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e5e7eb;
}

.search-bar {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.list-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;
}

.list-item:hover {
  background: #e5e7eb;
}

.list-item.active {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.list-item.completed .title {
  text-decoration: line-through;
  color: #9ca3af;
}

.list-item-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.menu-dropdown {
  margin-left: auto;
  flex-shrink: 0;
}

.menu-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.menu-btn:hover {
  background: #d1d5db;
  color: #4b5563;
}

.dropdown-menu {
  min-width: 100px;
  padding: 2px;
  overflow: hidden;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 5px 10px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.1s;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger:hover {
  background: #fef2f2;
}

.title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.date {
  font-size: 11px;
  color: #9ca3af;
}

.tags {
  display: flex;
  gap: 4px;
  overflow: hidden;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 13px;
}

.create-btn {
  margin: 12px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;
}

.create-btn:hover {
  background: #2563eb;
}
</style>
