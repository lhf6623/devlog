<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  color: string
  size?: 'sm' | 'md'
  removable?: boolean
  dot?: boolean
}>(), {
  size: 'md',
  removable: false,
  dot: false
})

const emit = defineEmits<{
  remove: [tag: string]
}>()
</script>

<template>
  <span
    class="tag-badge"
    :class="[
      size === 'sm' ? 'tag-badge-sm' : '',
      dot ? 'tag-badge-dot' : ''
    ]"
    :style="dot ? {} : { background: color + '20', color: color }"
  >
    <span v-if="dot" class="tag-dot" :style="{ background: color }"></span>
    <span :class="size === 'sm' ? 'overflow-hidden text-ellipsis' : ''">{{ name }}</span>
    <span v-if="removable" class="tag-badge-remove" @click.stop="emit('remove', name)">×</span>
  </span>
</template>
