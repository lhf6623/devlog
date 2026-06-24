import { createApp } from "vue";
import App from "./App.vue";
import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import naive from "naive-ui";

createApp(App).use(naive).mount("#app");
