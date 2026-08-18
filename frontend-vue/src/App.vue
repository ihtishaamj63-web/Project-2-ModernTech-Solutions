<!-- src/App.vue -->
<script setup>
import Navbar from './components/Navbar.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <div class="app-wrapper">
    <Navbar v-if="route.name !== 'Login'" />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-main {
  flex: 1;
  background: #f0f2f7;
  padding: 20px;
}
</style>