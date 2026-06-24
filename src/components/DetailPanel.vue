<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { WorkRecord } from '../types';
import { STATUS_MAP, getStatusInfo } from '../types';
import { renderMarkdown, formatTime } from '../utils';

const props = defineProps<{
  record: WorkRecord | null;
  categories: string[];
}>();

const emit = defineEmits<{
  (e: 'update', id: string, changes: Partial<WorkRecord>): void;
  (e: 'delete', id: string): void;
  (e: 'save', id: string): void;
}>();

const activeTab = ref<'edit' | 'preview'>('edit');
const saveStatus = ref('');
let saveStatusTimer: ReturnType<typeof setTimeout> | null = null;
let titleTimer: ReturnType<typeof setTimeout> | null = null;
let contentTimer: ReturnType<typeof setTimeout> | null = null;

const titleInput = ref('');
const contentInput = ref('');

// 切换记录时同步本地编辑状态
watch(() => props.record?.id, () => {
  syncLocal();
  activeTab.value = 'edit';
}, { immediate: true });

function syncLocal() {
  titleInput.value = props.record?.title ?? '';
  contentInput.value = props.record?.content ?? '';
}

function onTitleInput() {
  if (!props.record) return;
  if (titleTimer) clearTimeout(titleTimer);
  titleTimer = setTimeout(() => {
    emit('update', props.record!.id, { title: titleInput.value });
    showSaved();
  }, 600);
}

function onContentInput() {
  if (!props.record) return;
  if (contentTimer) clearTimeout(contentTimer);
  contentTimer = setTimeout(() => {
    emit('update', props.record!.id, { content: contentInput.value });
    showSaved();
  }, 800);
}

function onStatusChange(status: string) {
  if (!props.record) return;
  emit('update', props.record.id, { status });
}

function onCategoryChange(category: string) {
  if (!props.record) return;
  emit('update', props.record.id, { category });
}

function handleSave() {
  if (!props.record) return;
  emit('update', props.record.id, { title: titleInput.value, content: contentInput.value });
  setStatus('已保存');
}

function handleDelete() {
  if (!props.record) return;
  if (confirm('确定删除这条记录吗？')) {
    emit('delete', props.record.id);
  }
}

function showSaved() {
  setStatus('已保存');
}

function setStatus(text: string) {
  saveStatus.value = text;
  if (saveStatusTimer) clearTimeout(saveStatusTimer);
  saveStatusTimer = setTimeout(() => {
    saveStatus.value = '';
  }, 2000);
}

const previewHtml = ref('');
watch([activeTab, () => props.record?.content], async () => {
  if (activeTab.value === 'preview' && props.record) {
    await nextTick();
    previewHtml.value = renderMarkdown(props.record.content);
  }
});
</script>

<template>
  <!-- 空状态 -->
  <div v-if="!record" class="flex-1 flex items-center justify-center bg-white color-#9ca3af text-14px">
    选择或新建一条记录
  </div>

  <!-- 详情 -->
  <div v-else class="flex-1 min-w-0 bg-white flex flex-col">
    <!-- 头部 -->
    <div class="px-6 pt-5 pb-3 border-b border-#f0f0f2">
      <input
        v-model="titleInput"
        type="text"
        placeholder="输入标题"
        class="w-full border-none text-20px font-600 color-#1f1f1f outline-none p-0 mb-3.5 bg-transparent placeholder-color-#d1d5db"
        @input="onTitleInput"
      />
      <div class="flex items-center gap-5 flex-wrap">
        <!-- 状态 -->
        <div class="flex items-center gap-2">
          <span class="text-12px color-#9ca3af">状态</span>
          <span
            v-if="getStatusInfo(record.status)"
            :class="['status-badge', 'status-' + record.status]"
          >
            <span class="w-1.25 h-1.25 rounded-full inline-block" :style="{ background: getStatusInfo(record.status).color }"></span>
            {{ getStatusInfo(record.status).label }}
          </span>
          <select
            class="px-2 py-1 rounded-6 border border-#e5e7eb text-13px color-#4b5563 outline-none bg-white min-w-90px focus:border-brand"
            :value="record.status"
            @change="onStatusChange(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="(info, key) in STATUS_MAP" :key="key" :value="key">{{ info.label }}</option>
          </select>
        </div>
        <!-- 类别 -->
        <div class="flex items-center gap-2">
          <span class="text-12px color-#9ca3af">类别</span>
          <select
            class="px-2 py-1 rounded-6 border border-#e5e7eb text-13px color-#4b5563 outline-none bg-white min-w-90px focus:border-brand"
            :value="record.category"
            @change="onCategoryChange(($event.target as HTMLSelectElement).value)"
          >
            <option value="">未分类</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <!-- 创建时间 -->
        <div class="flex items-center gap-2">
          <span class="text-12px color-#9ca3af">创建</span>
          <span class="text-13px color-#4b5563 bg-#f3f4f6 px-2.5 py-0.75 rounded-6">{{ formatTime(record.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Tab 栏 -->
    <div class="flex gap-1 px-6 pt-3 pb-0 border-b border-#f0f0f2">
      <button
        :class="['px-4 py-1.5 inline-flex items-center text-13px bg-transparent border-none cursor-pointer transition-all-150',
                 activeTab === 'edit' ? 'color-brand font-500 border-b-2 border-brand' : 'color-#6b7280 hover:color-#1f1f1f hover:bg-warm']"
        @click="activeTab = 'edit'"
      >编辑</button>
      <button
        :class="['px-4 py-1.5 inline-flex items-center text-13px bg-transparent border-none cursor-pointer transition-all-150',
                 activeTab === 'preview' ? 'color-brand font-500 border-b-2 border-brand' : 'color-#6b7280 hover:color-#1f1f1f hover:bg-warm']"
        @click="activeTab = 'preview'"
      >预览</button>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 编辑 -->
      <div v-if="activeTab === 'edit'" class="p-4 px-6 h-full">
        <textarea
          v-model="contentInput"
          placeholder="在这里记录详细内容..."
          class="w-full h-full min-h-300px border-none outline-none resize-none font-mono text-14px leading-relaxed color-#374151 bg-transparent"
          @input="onContentInput"
        ></textarea>
      </div>
      <!-- 预览 -->
      <div v-else class="p-6 max-w-760px leading-relaxed preview-content" v-html="previewHtml"></div>
    </div>

    <!-- 底部栏 -->
    <div class="px-6 py-2.5 border-t border-#f0f0f2 flex items-center justify-between bg-#fafafa text-12px color-#9ca3af">
      <span>{{ formatTime(record.created_at) }} · {{ formatTime(record.updated_at) }}</span>
      <div class="flex items-center gap-2.5">
        <span class="save-status" :style="{ color: saveStatus === '已保存' ? '#22c55e' : '#9ca3af' }">{{ saveStatus }}</span>
        <button
          class="px-2 py-1.25 inline-flex items-center text-13px cursor-pointer border bg-white color-#ef4444 border-#fecaca hover:bg-#fef2f2"
          @click="handleDelete"
        ><span class="i-mdi-delete-outline text-16px"></span></button>
        <button
          class="px-2 py-1.25 inline-flex items-center text-13px cursor-pointer border-none bg-brand text-white hover:bg-brand-hover"
          @click="handleSave"
        ><span class="i-mdi-content-save-outline text-16px"></span></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-content :deep(h1) { font-size: 1.5rem; color: #1f1f1f; font-weight: 600; margin: 1.25rem 0 0.75rem; }
.preview-content :deep(h2) { font-size: 1.25rem; color: #1f1f1f; font-weight: 600; margin: 1.25rem 0 0.75rem; }
.preview-content :deep(h3) { font-size: 1.125rem; color: #1f1f1f; font-weight: 600; margin: 1.25rem 0 0.75rem; }
.preview-content :deep(p)  { color: #4b5563; margin-bottom: 0.75rem; }
.preview-content :deep(ul),
.preview-content :deep(ol) { color: #4b5563; padding-left: 1.25rem; }
.preview-content :deep(li) { margin-bottom: 0.25rem; }
.preview-content :deep(pre) { background: #f8f7fa; padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; }
.preview-content :deep(code) { background: #f8f7fa; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.75rem; }
.preview-content :deep(blockquote) { border-left: 3px solid #e5e7eb; padding-left: 0.75rem; color: #6b7280; }
.status-pending    { background: #fff7ed; color: #c2410c; }
.status-in-progress { background: #eef2ff; color: #4f46e5; }
.status-completed  { background: #f0fdf4; color: #15803d; }
.status-archived   { background: #f3f4f6; color: #6b7280; }
</style>
