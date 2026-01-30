<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/auth.php';

$auth = new Auth();
$auth->logout();

setFlash('success', 'You have been logged out successfully');
redirect(APP_URL . '/index.php');
