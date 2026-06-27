<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useLogStore } from '../store/logStore'
import Dropdown from './Dropdown.vue'
import TagMenu from './TagMenu.vue'

const store = useLogStore()
const showNewTagInput = ref(false)
const newTagName = ref('')
const renamingTag = ref<string | null>(null)
const renameInput = ref('')

type TimeFilter = 'today' | 'week' | 'month' | 'earlier'
type StatusFilter = 'all' | 'pending' | 'completed'

const timeOptions: { key: TimeFilter; label: string; count: () => number }[] = [
  { key: 'today', label: '今天', count: () => store.todayCount },
  { key: 'week', label: '本周', count: () => store.weekCount },
  { key: 'month', label: '本月', count: () => store.monthCount },
  { key: 'earlier', label: '更早', count: () => store.earlierCount },
]

const statusOptions: { key: StatusFilter; label: string; icon: string; count: () => number }[] = [
  { key: 'pending', label: '待办', icon: 'i-mdi-clock-outline', count: () => store.pendingCount },
  { key: 'completed', label: '已办', icon: 'i-mdi-check-circle-outline', count: () => store.completedCount },
]
function addTag() {
  const name = newTagName.value.trim()
  if (!name) return
  store.createTag(name)
  newTagName.value = ''
  showNewTagInput.value = false
}

function cancelAddTag() {
  newTagName.value = ''
  showNewTagInput.value = false
}

function startRename(tag: string) {
  renamingTag.value = tag
  renameInput.value = tag
  nextTick(() => {
    const input = document.querySelector('.rename-tag-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function confirmRename() {
  if (renamingTag.value) {
    store.renameTag(renamingTag.value, renameInput.value)
  }
  renamingTag.value = null
}

function cancelRename() {
  renamingTag.value = null
}

function pickColor(tag: string, color: string) {
  store.setTagColor(tag, color)
}
</script>

<template>
  <div class="navigator">
    <!-- 时间分类 -->
    <div class="nav-section">
      <div class="section-title">时间</div>
      <div
        v-for="opt in timeOptions"
        :key="opt.key"
        class="nav-item"
        :class="{ active: store.timeFilter === opt.key }"
        @click="store.setTimeFilter(opt.key)"
      >
        <span class="nav-label">{{ opt.label }}</span>
        <span class="nav-count">{{ opt.count() }}</span>
      </div>
    </div>

    <!-- 状态分类 -->
    <div class="nav-section">
      <div class="section-title">状态</div>
      <div
        v-for="opt in statusOptions"
        :key="opt.key"
        class="nav-item"
        :class="{ active: store.statusFilter === opt.key }"
        @click="store.toggleStatusFilter(opt.key)"
      >
        <span class="nav-icon" :class="opt.icon"></span>
        <span class="nav-label">{{ opt.label }}</span>
      </div>
    </div>

    <!-- 标签 -->
    <div class="nav-section">
      <div class="section-title">标签</div>
      <div
        v-for="tag in store.allTags"
        :key="tag"
        class="nav-item tag-item"
        :class="{ active: store.selectedTags.includes(tag) }"
        @click="store.toggleTagFilter(tag)"
      >
        <template v-if="renamingTag === tag">
          <input
            v-model="renameInput"
            type="text"
            class="rename-tag-input"
            @keydown.enter.stop="confirmRename"
            @keydown.escape.stop="cancelRename"
            @click.stop
          />
        </template>
        <template v-else>
          <Dropdown class="tag-dot-dropdown">
            <template #trigger>
              <span
                class="tag-dot cursor-pointer transition-transform hover:scale-130"
                :style="{ background: store.getTagColor(tag) }"
              ></span>
            </template>
            <div class="color-popup">
              <span
                v-for="color in store.COLOR_PALETTE"
                :key="color"
                class="color-dot"
                :style="{ background: color }"
                @click="pickColor(tag, color)"
              ></span>
              <label class="color-custom-label">
                <input
                  type="color"
                  class="color-custom-input"
                  :value="store.getTagColor(tag)"
                  @input="pickColor(tag, ($event.target as HTMLInputElement).value)"
                />
                <span>自定义</span>
              </label>
            </div>
          </Dropdown>
          <span class="nav-label">{{ tag }}</span>
          <TagMenu :tag="tag" @click.stop @rename="startRename" @delete="store.deleteTag" />
        </template>
      </div>
      <!-- 新增标签 -->
      <div v-if="showNewTagInput" class="new-tag-input">
        <input
          v-model="newTagName"
          type="text"
          placeholder="输入标签名"
          class="tag-input"
          @keydown.enter="addTag"
          @keydown.escape="cancelAddTag"
          ref="tagInputRef"
        />
      </div>
      <div v-else class="nav-item add-tag-btn" @click="showNewTagInput = true">
        <span class="i-mdi-plus"></span>
        <span>新标签</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.navigator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f1f3;
  border-right: 1px solid #e5e7eb;
  padding: 12px 8px;
  overflow-y: auto;
  width: 180px;
  min-width: 160px;
  flex-shrink: 0;
}

.nav-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 10px;
  margin-bottom: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
  transition: all 0.15s;
}

.nav-item:hover {
  background: #e5e7eb;
}

.nav-item.active {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 500;
}

.nav-icon {
  font-size: 16px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-count {
  font-size: 11px;
  color: #9ca3af;
  background: #e5e7eb;
  padding: 1px 6px;
  border-radius: 8px;
  min-width: 20px;
  text-align: center;
}

.nav-item.active .nav-count {
  background: #93c5fd;
  color: #1d4ed8;
}

.tag-item.active .tag-dot {
  background: #3b82f6 !important;
}

.tag-item {
  position: relative;
}

.tag-item:hover :deep(.menu-trigger) {
  opacity: 1;
}

.tag-dot-dropdown :deep(> div) {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.add-tag-btn {
  color: #9ca3af;
  font-size: 12px;
}

.add-tag-btn:hover {
  color: #3b82f6;
}

.new-tag-input {
  padding: 4px 10px;
}

.tag-input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.tag-input:focus {
  border-color: #3b82f6;
}

.rename-tag-input {
  flex: 1;
  padding: 2px 6px;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  min-width: 0;
  background: #fff;
}
</style>
