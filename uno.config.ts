import { defineConfig,presetMini, presetAttributify, presetIcons } from "unocss";

export default defineConfig({
  presets: [presetMini(), presetAttributify(), presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
  })],
  theme: {
    colors: {
      brand: "#6d5dfc",
      "brand-hover": "#5b4cdb",
      "brand-light": "#ede9fe",
      "brand-bg": "#f4f3ff",
      warm: "#f8f7fa",
    },
  },
  shortcuts: {
    "sidebar-btn":
      "w-full flex items-center justify-between px-2 py-1.5 text-13px color-#4b5563 bg-transparent border-none cursor-pointer transition-all-150 hover:bg-#f2f0f8 hover:color-#1f1f1f",
    "sidebar-btn-active":
      "bg-#ede9fe color-#6d5dfc font-500",
    "status-badge":
      "inline-flex items-center gap-1 text-11px font-500 px-2 py-0.5 rounded-full",
    "card":
      "bg-white px-3 py-2.5 mb-1.5 cursor-pointer",
    "card-active":
      "bg-#ede9fe",
  },
});
