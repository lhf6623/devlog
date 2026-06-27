<script setup lang="ts">
import { onMounted } from 'vue'
import { useLogStore } from './store/logStore'
import Navigator from './components/Navigator.vue'
import Sidebar from './components/Sidebar.vue'
import Editor from './components/Editor.vue'

const store = useLogStore()

onMounted(() => {
  store.loadData()
})
</script>

<template>
  <div class="app">
    <Navigator />
    <div class="sidebar-panel">
      <Sidebar />
    </div>
    <div class="editor-panel">
      <Editor />
    </div>
  </div>
</template>

<style>
html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
}

.app {
  display: flex;
  height: 100%;
}

.sidebar-panel {
  width: 300px;
  min-width: 260px;
  flex-shrink: 0;
}

.editor-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
}
</style>
