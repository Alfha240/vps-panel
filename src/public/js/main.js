// Main client-side JavaScript
console.log('VPS Control Panel Loaded');

// Confirmation dialogs for destructive actions
document.addEventListener('DOMContentLoaded', () => {
    // Add confirmation to delete forms
    document.querySelectorAll('form[action*="/delete"]').forEach((form) => {
        form.addEventListener('submit', (e) => {
            if (!confirm('Are you sure you want to delete this? This action cannot be undone.')) {
                e.preventDefault();
            }
        });
    });

    // Handle success/error messages from query params
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success) {
        showNotification(getSuccessMessage(success), 'success');
    }

    if (error) {
        showNotification(getErrorMessage(error), 'error');
    }
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function getSuccessMessage(key) {
    const messages = {
        created: 'Successfully created!',
        updated: 'Successfully updated!',
        deleted: 'Successfully deleted!',
        suspended: 'Server suspended successfully!',
        unsuspended: 'Server unsuspended successfully!',
        revoked: 'Token revoked successfully!',
    };
    return messages[key] || 'Operation completed successfully!';
}

function getErrorMessage(key) {
    const messages = {
        failed: 'Operation failed. Please try again.',
        missing_fields: 'Please fill in all required fields.',
        has_nodes: 'Cannot delete: location has nodes assigned.',
        has_servers: 'Cannot delete: resource has servers assigned.',
        has_assigned_ips: 'Cannot delete: IP pool has assigned addresses.',
        connection_failed: 'Failed to connect to Proxmox node.',
        cannot_modify_self: 'You cannot modify your own account.',
        cannot_delete_self: 'You cannot delete your own account.',
    };
    return messages[key] || 'An error occurred.';
}
