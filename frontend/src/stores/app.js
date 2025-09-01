import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const toasts = ref([])

  let toastId = 0

  const setLoading = (value) => {
    loading.value = value
  }

  const showToast = (message, type = 'info', title = '', duration = 5000) => {
    const id = ++toastId
    const toast = {
      id,
      message,
      type,
      title: title || getDefaultTitle(type),
    }

    toasts.value.push(toast)

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearToasts = () => {
    toasts.value = []
  }

  const getDefaultTitle = (type) => {
    switch (type) {
      case 'success':
        return 'Success'
      case 'error':
        return 'Error'
      case 'warning':
        return 'Warning'
      case 'info':
      default:
        return 'Information'
    }
  }

  // Convenience methods
  const showSuccess = (message, title = 'Success') => {
    return showToast(message, 'success', title)
  }

  const showError = (message, title = 'Error') => {
    return showToast(message, 'error', title, 8000) // Longer duration for errors
  }

  const showWarning = (message, title = 'Warning') => {
    return showToast(message, 'warning', title)
  }

  const showInfo = (message, title = 'Information') => {
    return showToast(message, 'info', title)
  }

  return {
    loading,
    toasts,
    setLoading,
    showToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
})
