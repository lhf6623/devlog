<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = withDefaults(defineProps<{
  position?: 'bottom' | 'right'
  align?: 'left' | 'right'
  trigger?: 'click' | 'manual'
}>(), {
  position: 'bottom',
  align: 'left',
  trigger: 'click'
})

const emit = defineEmits<{
  toggle: [open: boolean]
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popupRef = ref<HTMLElement | null>(null)
const popupStyle = ref<Record<string, string>>({})

function toggle(e: Event) {
  if (props.trigger !== 'click') return
  e.stopPropagation()
  isOpen.value = !isOpen.value
  emit('toggle', isOpen.value)
}

function open() {
  isOpen.value = true
  emit('toggle', true)
}

function close() {
  isOpen.value = false
  emit('toggle', false)
}

function handleDocumentClick(e: MouseEvent) {
  if (!triggerRef.value?.contains(e.target as Node) &&
      !popupRef.value?.contains(e.target as Node)) {
    close()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

function calcPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const style: Record<string, string> = {}

  if (props.position === 'bottom') {
    style.top = `${rect.bottom + 4}px`
    if (props.align === 'right') {
      style.right = `${window.innerWidth - rect.right}px`
    } else {
      style.left = `${rect.left}px`
    }
  } else if (props.position === 'right') {
    style.left = `${rect.right + 4}px`
    style.top = `${rect.top + rect.height / 2}px`
    style.transform = 'translateY(-50%)'
  }

  popupStyle.value = style
}

watch(isOpen, async (val) => {
  if (val) {
    await nextTick()
    calcPosition()
  }
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', close, true)
  window.addEventListener('resize', close)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('resize', close)
})

defineExpose({ isOpen, open, close })
</script>

<template>
  <div class="relative">
    <div ref="triggerRef" class="cursor-pointer" @click="toggle">
      <slot name="trigger"></slot>
    </div>
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="popupRef"
        class="dropdown-popup"
        :style="popupStyle"
        @click.stop
      >
        <slot></slot>
      </div>
    </Teleport>
  </div>
</template>

