<template>
  <div class="auth-container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'AuthLayout',
}
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  width: 100%;
  padding: 2rem;
}
</style>
