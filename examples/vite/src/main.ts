import { createApp } from 'vue'
import './style.css'
import App, { addon } from './App.vue'
console.log(await addon())
createApp(App).mount('#app')
