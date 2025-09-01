<template>
  <div class="container-fluid py-4">
    <div class="text-center py-5">
      <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
      <h1 class="mt-3">404 - Page Not Found</h1>
      <p class="text-muted">The page you're looking for doesn't exist.</p>
      <router-link to="/" class="btn btn-primary">
        <i class="bi bi-house-door me-2"></i>
        Go Home
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
}
</script>
