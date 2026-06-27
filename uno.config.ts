import { defineConfig, presetMini, presetAttributify, presetIcons } from "unocss";

export default defineConfig({
  presets: [presetMini(), presetAttributify(), presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
  })],
  shortcuts: {
    // Dropdown 弹窗
    'dropdown-popup': 'fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
    // 三点菜单触发按钮
    'menu-trigger': 'w-5 h-5 rounded border-none bg-transparent text-gray-400 cursor-pointer flex items-center justify-center text-sm flex-shrink-0 opacity-0 transition-all hover:opacity-100 hover:bg-gray-300 hover:text-gray-600',
    // 菜单内按钮项
    'menu-btn-item': 'w-full py-1 px-2 border-none bg-transparent text-left text-[11px] cursor-pointer rounded transition-colors',
    // 标签徽章基础
    'tag-badge': 'inline-flex items-center gap-1 rounded whitespace-nowrap overflow-hidden px-2.5 py-0.5 text-xs',
    // 标签徽章小尺寸
    'tag-badge-sm': 'px-1.5 py-0.5 text-[10px] max-w-20 flex-shrink',
    // 标签徽章圆点模式
    'tag-badge-dot': 'bg-transparent p-0 gap-1.5',
    // 标签删除按钮
    'tag-badge-remove': 'cursor-pointer text-sm leading-none opacity-60 hover:opacity-100 transition-opacity flex-shrink-0',
    // 标签圆点
    'tag-dot': 'w-2.5 h-2.5 rounded-full flex-shrink-0',
    // 颜色选择器网格
    'color-popup': 'p-1.5 flex flex-wrap gap-1 w-30',
    // 颜色选项圆点
    'color-dot': 'w-[18px] h-[18px] rounded-full cursor-pointer transition-transform hover:scale-120',
    // 自定义取色器标签
    'color-custom-label': 'flex items-center gap-1.5 w-full mt-1 pt-1 border-t border-gray-200 cursor-pointer text-[11px] text-gray-500',
    // 自定义取色器输入框
    'color-custom-input': 'w-[22px] h-[22px] border-none rounded cursor-pointer p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-gray-300 [&::-webkit-color-swatch]:rounded',
  },
});
