<script setup lang="ts">
import { ref } from 'vue'
import Dropdown from './Dropdown.vue'

const props = defineProps<{
  tag: string
}>()

const emit = defineEmits<{
  rename: [tag: string]
  delete: [tag: string]
}>()

const confirmDelete = ref(false)

function handleDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  emit('delete', props.tag)
}

function onToggle(open: boolean) {
  if (open) confirmDelete.value = false
}
</script>

<template>
  <Dropdown class="tag-menu flex-shrink-0" @toggle="onToggle">
    <template #trigger>
      <button class="menu-trigger">
        <span class="i-mdi-dots-vertical"></span>
      </button>
    </template>
    <div class="p-1 w-25">
      <button
        class="menu-btn-item text-gray-700 hover:bg-gray-100"
        @click="emit('rename', props.tag)"
      >
        重命名
      </button>
      <button
        class="menu-btn-item text-red-500 hover:bg-red-50"
        :class="{ 'bg-red-50 font-semibold': confirmDelete }"
        @click="handleDelete"
      >
        {{ confirmDelete ? '确认删除' : '删除标签' }}
      </button>
    </div>
  </Dropdown>
</template>

<style scoped>
.tag-menu:hover .menu-trigger {
  opacity: 1;
}
</style>
