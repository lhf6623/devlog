import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import { ref, computed } from 'vue'

export interface LogItem {
  id: string
  title: string
  content: string
  tags: string[]
  completed: boolean
  createdAt: string
  updatedAt: string
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 预设颜色板
const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

export const useLogStore = defineStore('log', () => {
  const items = ref<LogItem[]>([])
  const currentItemId = ref<string | null>(null)
  const searchQuery = ref('')
  const selectedTags = ref<string[]>([])
  const loaded = ref(false)
  const tagColors = ref<Record<string, string>>({})
  const globalTags = ref<string[]>([])

  // 分类筛选
  type TimeFilter = 'today' | 'week' | 'month' | 'earlier'
  type StatusFilter = 'all' | 'pending' | 'completed'
  const timeFilter = ref<TimeFilter>('today')
  const statusFilter = ref<StatusFilter>('all')

  // 当前时间范围内的条目
  const timeFilteredItems = computed(() => {
    if (timeFilter.value === 'today') return items.value.filter(i => isToday(i.createdAt))
    if (timeFilter.value === 'week') return items.value.filter(i => isThisWeek(i.createdAt))
    if (timeFilter.value === 'month') return items.value.filter(i => isThisMonth(i.createdAt))
    return items.value.filter(i => !isThisMonth(i.createdAt)) // earlier
  })

  // 时间分类计数（始终基于全部条目）
  const todayCount = computed(() => items.value.filter(i => isToday(i.createdAt)).length)
  const weekCount = computed(() => items.value.filter(i => isThisWeek(i.createdAt)).length)
  const monthCount = computed(() => items.value.filter(i => isThisMonth(i.createdAt)).length)
  const earlierCount = computed(() => items.value.filter(i => !isThisMonth(i.createdAt)).length)

  // 状态计数（基于当前时间筛选）
  const pendingCount = computed(() => timeFilteredItems.value.filter(i => !i.completed).length)
  const completedCount = computed(() => timeFilteredItems.value.filter(i => i.completed).length)

  // 标签列表（全局，不受时间筛选影响）
  const allTags = computed(() => {
    const tagSet = new Set<string>(globalTags.value)
    items.value.forEach(item => item.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  })

  // 标签计数（基于全部条目）
  const tagCounts = computed(() => {
    const counts: Record<string, number> = {}
    items.value.forEach(item => item.tags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1
    }))
    return counts
  })

  // 创建全局标签
  function createTag(name: string) {
    const tag = name.trim()
    if (!tag || globalTags.value.includes(tag)) return
    globalTags.value.push(tag)
    saveData()
  }

  // 重命名标签
  function renameTag(oldName: string, newName: string) {
    const name = newName.trim()
    if (!name || name === oldName) return
    // 检查重名
    if (globalTags.value.includes(name) || items.value.some(i => i.tags.includes(name))) return
    // 替换所有条目中的标签
    items.value.forEach(item => {
      const idx = item.tags.indexOf(oldName)
      if (idx !== -1) item.tags[idx] = name
    })
    // 替换全局标签列表
    const gIdx = globalTags.value.indexOf(oldName)
    if (gIdx !== -1) globalTags.value[gIdx] = name
    // 迁移颜色
    if (tagColors.value[oldName]) {
      tagColors.value[name] = tagColors.value[oldName]
      delete tagColors.value[oldName]
    }
    // 替换筛选选中
    const sIdx = selectedTags.value.indexOf(oldName)
    if (sIdx !== -1) selectedTags.value[sIdx] = name
    saveData()
  }

  // 全局删除标签
  function deleteTag(name: string) {
    // 从所有条目中移除
    items.value.forEach(item => {
      const idx = item.tags.indexOf(name)
      if (idx !== -1) item.tags.splice(idx, 1)
    })
    // 从全局标签列表移除
    const gIdx = globalTags.value.indexOf(name)
    if (gIdx !== -1) globalTags.value.splice(gIdx, 1)
    // 清除颜色
    delete tagColors.value[name]
    // 清除筛选选中
    const sIdx = selectedTags.value.indexOf(name)
    if (sIdx !== -1) selectedTags.value.splice(sIdx, 1)
    saveData()
  }

  // 获取标签颜色，自动分配
  function getTagColor(tag: string): string {
    if (tagColors.value[tag]) return tagColors.value[tag]
    // 自动从未使用的颜色中选一个
    const usedColors = new Set(Object.values(tagColors.value))
    const color = COLOR_PALETTE.find(c => !usedColors.has(c)) || COLOR_PALETTE[Object.keys(tagColors.value).length % COLOR_PALETTE.length]
    tagColors.value[tag] = color
    return color
  }

  function setTagColor(tag: string, color: string) {
    tagColors.value[tag] = color
    saveData()
  }

  // 时间分类计数
  function isToday(dateStr: string): boolean {
    const d = new Date(dateStr)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }

  function isThisWeek(dateStr: string): boolean {
    const d = new Date(dateStr)
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1) // 周一开始
    startOfWeek.setHours(0, 0, 0, 0)
    return d >= startOfWeek
  }

  function isThisMonth(dateStr: string): boolean {
    const d = new Date(dateStr)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }

  const filteredItems = computed(() => {
    let result = timeFilteredItems.value

    // 状态筛选
    if (statusFilter.value === 'pending') {
      result = result.filter(i => !i.completed)
    } else if (statusFilter.value === 'completed') {
      result = result.filter(i => i.completed)
    }

    // 按标签筛选
    if (selectedTags.value.length > 0) {
      result = result.filter(item =>
        selectedTags.value.some(tag => item.tags.includes(tag))
      )
    }

    // 按关键词搜索（标题 + 内容）
    const query = searchQuery.value.trim().toLowerCase()
    if (query) {
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      )
    }

    // 按更新时间降序
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  })

  const currentItem = computed(() =>
    items.value.find(item => item.id === currentItemId.value) ?? null
  )

  async function loadData() {
    try {
      const json = await invoke<string>('load_data')
      const data = JSON.parse(json)
      // 兼容旧数据格式
      if (Array.isArray(data)) {
        items.value = data
        tagColors.value = {}
      } else {
        items.value = data.items || []
        tagColors.value = data.tagColors || {}
        globalTags.value = data.globalTags || []
      }
      loaded.value = true
    } catch (e) {
      console.error('Failed to load data:', e)
      items.value = []
      tagColors.value = {}
      loaded.value = true
    }
  }

  async function saveData() {
    try {
      const json = JSON.stringify({ items: items.value, tagColors: tagColors.value, globalTags: globalTags.value })
      await invoke('save_data', { data: json })
    } catch (e) {
      console.error('Failed to save data:', e)
    }
  }

  function createItem() {
    const now = new Date().toISOString()
    const item: LogItem = {
      id: generateId(),
      title: '未命名记录',
      content: '',
      tags: [],
      completed: false,
      createdAt: now,
      updatedAt: now,
    }
    items.value.unshift(item)
    currentItemId.value = item.id
    saveData()
    return item
  }

  function updateItem(id: string, updates: Partial<Omit<LogItem, 'id' | 'createdAt'>>) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    Object.assign(item, updates, { updatedAt: new Date().toISOString() })
    saveData()
  }

  function deleteItem(id: string) {
    const index = items.value.findIndex(i => i.id === id)
    if (index === -1) return
    items.value.splice(index, 1)
    if (currentItemId.value === id) {
      currentItemId.value = items.value.length > 0 ? items.value[0].id : null
    }
    saveData()
  }

  function toggleComplete(id: string) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    item.completed = !item.completed
    item.updatedAt = new Date().toISOString()
    saveData()
  }

  function selectItem(id: string) {
    currentItemId.value = id
  }

  function toggleTagFilter(tag: string) {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value.splice(index, 1)
    }
  }

  function setTimeFilter(filter: TimeFilter) {
    timeFilter.value = filter
  }

  function setStatusFilter(filter: StatusFilter) {
    statusFilter.value = filter
  }

  // 状态筛选切换：点击已选项取消选中
  function toggleStatusFilter(filter: StatusFilter) {
    statusFilter.value = statusFilter.value === filter ? 'all' : filter
  }

  return {
    items,
    currentItemId,
    searchQuery,
    selectedTags,
    loaded,
    timeFilter,
    statusFilter,
    allTags,
    tagCounts,
    todayCount,
    weekCount,
    monthCount,
    earlierCount,
    pendingCount,
    completedCount,
    filteredItems,
    currentItem,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
    selectItem,
    toggleTagFilter,
    setTimeFilter,
    setStatusFilter,
    toggleStatusFilter,
    createTag,
    renameTag,
    deleteTag,
    tagColors,
    getTagColor,
    setTagColor,
    COLOR_PALETTE,
  }
})
