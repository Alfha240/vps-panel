    <!-- Footer -->
    <footer style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; border-top: 1px solid var(--border-color); margin-top: 40px;">
        <p>VPS Panel v1.0.0 | Built with ❤️ using Pure PHP</p>
        <p style="margin-top: 8px;">© <?php echo date('Y'); ?> All rights reserved.</p>
    </footer>
</div>

<script>
// Mobile sidebar toggle
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// Auto-hide alerts
setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    });
}, 5000);
</script>

</body>
</html>
