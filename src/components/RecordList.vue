<script setup lang="ts">
import { ref } from 'vue';
import type { WorkRecord } from '../types';
import { getStatusInfo } from '../types';
import { formatTime } from '../utils';

defineProps<{
  records: WorkRecord[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'create'): void;
  (e: 'search', keyword: string): void;
}>();

const searchText = ref('');

function onSearchInput() {
  emit('search', searchText.value);
}
</script>

<template>
  <div class="w-320px flex-shrink-0 bg-warm border-r border-#edeef3 flex flex-col">
    <!-- Header -->
    <div class="px-4 pt-4 pb-0">
      <div class="flex items-center justify-between mb-3">
        <div class="text-14px font-500 color-#1f1f1f">
          本周记录<span class="text-12px color-#9ca3af font-normal ml-1">{{ records.length }} 条</span>
        </div>
        <button
          class="px-2.5 h-26px border-none rounded-6 bg-brand text-white text-12px cursor-pointer"
          @click="emit('create')"
        ><span class="i-mdi-plus text-16px mr-1 -ml-0.5"></span>新建记录</button>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="px-4 pb-3">
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索标题、内容或类别"
        class="w-full px-2.5 py-1.75 border border-#e5e7eb rounded-8 text-13px outline-none bg-white focus:border-brand"
        @input="onSearchInput"
      />
    </div>

    <!-- 列表 -->
    <div class="flex-1 overflow-y-auto px-3 pb-3">
      <div
        v-for="r in records"
        :key="r.id"
        :class="['card', r.id === selectedId && 'card-active']"
        :style="{ borderLeft: '3px solid ' + getStatusInfo(r.status).color }"
        @click="emit('select', r.id)"
      >
        <div class="flex items-center gap-2">
          <h3 class="text-13px font-500 color-#1f1f1f m-0 overflow-hidden text-ellipsis whitespace-nowrap flex-1">
            {{ r.title || '无标题' }}
          </h3>
          <span class="text-11px color-#9ca3af flex-shrink-0">{{ formatTime(r.updated_at) }}</span>
        </div>
      </div>
      <div v-if="records.length === 0" class="text-center color-#9ca3af text-13px mt-15">
        没有符合条件的记录
      </div>
    </div>
  </div>
</template>
