<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useLogStore } from '../store/logStore'
import { marked } from 'marked'
import Dropdown from './Dropdown.vue'
import TagBadge from './TagBadge.vue'

const store = useLogStore()
const isPreview = ref(false)
const tagInput = ref('')
const tagDropdown = ref<InstanceType<typeof Dropdown> | null>(null)

const item = computed(() => store.currentItem)

// 可选标签列表（排除已关联的，支持输入过滤）
const availableTags = computed(() => {
  if (!item.value) return []
  const assigned = new Set(item.value.tags)
  const query = tagInput.value.trim().toLowerCase()
  return store.allTags.filter(tag => {
    if (assigned.has(tag)) return false
    if (query && !tag.toLowerCase().includes(query)) return false
    return true
  })
})

// 本地编辑状态，避免频繁触发保存
const localTitle = ref('')
const localContent = ref('')

watch(() => store.currentItemId, () => {
  if (item.value) {
    localTitle.value = item.value.title
    localContent.value = item.value.content
    isPreview.value = false
  }
}, { immediate: true })

// 防抖保存
let saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (item.value) {
      // 只有内容真正变化时才更新
      if (localTitle.value === item.value.title && localContent.value === item.value.content) {
        return
      }
      store.updateItem(item.value.id, {
        title: localTitle.value,
        content: localContent.value,
      })
    }
  }, 500)
}

watch(localTitle, debouncedSave)
watch(localContent, debouncedSave)

function addTag(tagName?: string) {
  const tag = (tagName ?? tagInput.value).trim()
  if (!tag || !item.value) return
  // 确保标签加入全局标签列表
  store.createTag(tag)
  if (!item.value.tags.includes(tag)) {
    store.updateItem(item.value.id, {
      tags: [...item.value.tags, tag],
    })
  }
  tagInput.value = ''
  tagDropdown.value?.close()
}

function removeTag(tag: string) {
  if (!item.value) return
  store.updateItem(item.value.id, {
    tags: item.value.tags.filter(t => t !== tag),
  })
}

const renderedMarkdown = computed(() => {
  if (!localContent.value) return '<p class="empty-preview">暂无内容</p>'
  return marked(localContent.value) as string
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="editor" v-if="item">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button
          class="tool-btn"
          :class="{ active: !isPreview }"
          @click="isPreview = false"
        >
          编辑
        </button>
        <button
          class="tool-btn"
          :class="{ active: isPreview }"
          @click="isPreview = true"
        >
          预览
        </button>
      </div>
    </div>

    <!-- 标题 -->
    <input
      v-model="localTitle"
      type="text"
      class="title-input"
      placeholder="输入标题..."
    />

    <!-- 日期信息 -->
    <div class="date-info">
      <span>创建：{{ formatDate(item.createdAt) }}</span>
      <span>修改：{{ formatDate(item.updatedAt) }}</span>
    </div>

    <!-- 标签 -->
    <div class="tags-section">
      <div class="tags-list">
        <TagBadge
          v-for="tag in item.tags"
          :key="tag"
          :name="tag"
          :color="store.getTagColor(tag)"
          removable
          @remove="removeTag"
        />
      </div>
      <Dropdown ref="tagDropdown" trigger="manual" class="tag-dropdown-wrapper">
        <template #trigger>
          <input
            v-model="tagInput"
            type="text"
            class="tag-input"
            placeholder="添加标签"
            @keydown.enter="addTag()"
            @focus="tagDropdown?.open()"
            @click="tagDropdown?.open()"
          />
        </template>
        <div v-if="availableTags.length > 0" class="tag-picker-list">
          <div
            v-for="tag in availableTags"
            :key="tag"
            class="tag-picker-item"
            @mousedown.prevent="addTag(tag)"
          >
            <TagBadge :name="tag" :color="store.getTagColor(tag)" dot />
          </div>
        </div>
      </Dropdown>
    </div>

    <!-- 编辑/预览区域 -->
    <div class="content-area">
      <textarea
        v-if="!isPreview"
        v-model="localContent"
        class="markdown-input"
        placeholder="输入 Markdown 内容..."
      ></textarea>
      <div
        v-else
        class="markdown-preview"
        v-html="renderedMarkdown"
      ></div>
    </div>
  </div>

  <!-- 空状态 -->
  <div v-else class="no-selection">
    <div class="no-selection-content">
      <div class="no-selection-icon">📝</div>
      <p>选择一条记录或创建新记录</p>
    </div>
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 4px;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: #f3f4f6;
}

.tool-btn.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.title-input {
  font-size: 20px;
  font-weight: 600;
  border: none;
  outline: none;
  padding: 8px 0;
  color: #1f2937;
  background: transparent;
}

.title-input::placeholder {
  color: #d1d5db;
}

.date-info {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.tags-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.tags-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-input {
  border: none;
  outline: none;
  font-size: 12px;
  padding: 4px 8px;
  min-width: 140px;
  background: transparent;
  color: #4b5563;
}

.tag-input::placeholder {
  color: #d1d5db;
}

.tag-dropdown-wrapper {
  position: relative;
}

.tag-dropdown-wrapper :deep(.dropdown-trigger) {
  cursor: text;
}

.tag-picker-list {
  max-height: 150px;
  overflow-y: auto;
  min-width: 140px;
  padding: 4px;
}

.tag-picker-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.1s;
}

.tag-picker-item:hover {
  background: #f3f4f6;
}

.content-area {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.markdown-input {
  width: 100%;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  line-height: 1.6;
  resize: none;
  outline: none;
  color: #1f2937;
  background: #fafafa;
  transition: border-color 0.2s;
}

.markdown-input:focus {
  border-color: #3b82f6;
}

.markdown-preview {
  width: 100%;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  background: #fff;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.markdown-preview :deep(p) {
  margin-bottom: 8px;
}

.markdown-preview :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.markdown-preview :deep(pre) {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid #3b82f6;
  padding-left: 12px;
  color: #6b7280;
  margin: 12px 0;
}

.empty-preview {
  color: #9ca3af;
  font-style: italic;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fafafa;
}

.no-selection-content {
  text-align: center;
  color: #9ca3af;
}

.no-selection-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
</style>
