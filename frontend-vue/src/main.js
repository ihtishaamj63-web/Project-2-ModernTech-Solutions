// frontend-vue/src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Fix CSS import path
import './assets/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const app = createApp(App);
app.use(router); // Initialize router
app.mount('#app');