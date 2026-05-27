import Swal from 'sweetalert2';

/**
 * Confirm deletion with SweetAlert2
 * @param {Object} options - Configuration object
 * @param {string} options.title - Dialog title (default: "Delete this item?")
 * @param {string} options.message - Confirmation message (default: "Are you sure?")
 * @param {function} options.onConfirm - Callback function if user confirms deletion
 * @param {string} options.itemName - Name of item being deleted (used in message if message not provided)
 */
export const confirmDelete = async (options = {}) => {
  const {
    title = 'Delete this item?',
    message = 'Are you sure? This action cannot be undone.',
    onConfirm,
    itemName = '',
  } = options;

  const result = await Swal.fire({
    title,
    html: itemName ? message.replace('{name}', `<b>${itemName}</b>`) : message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    didOpen: (modal) => {
      const confirmBtn = modal.querySelector('.swal2-confirm');
      if (confirmBtn) {
        confirmBtn.style.background = '#ef4444';
        confirmBtn.style.borderColor = '#dc2626';
      }
    },
  });

  if (result.isConfirmed && onConfirm) {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
  }
};

/**
 * Show success message
 */
export const showSuccess = (message = 'Operation successful!') => {
  return Swal.fire({
    icon: 'success',
    title: message,
    timer: 1500,
    showConfirmButton: false,
    position: 'top-end',
  });
};

/**
 * Show error message
 */
export const showError = (message = 'Operation failed!') => {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonColor: '#ef4444',
  });
};
