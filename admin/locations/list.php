<?php
// admin/locations/list.php
// Location Management
require_once "../../config.php";
require_once "../../includes/middleware.php";

requireAdmin();

$success = $error = "";

// Handle location creation
if($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['create_location'])) {
    $short_code = sanitize($_POST['short_code']);
    $name = sanitize($_POST['name']);
    $description = sanitize($_POST['description']);
    
    if(verifyCSRFToken($_POST['csrf_token'])) {
        $stmt = $pdo->prepare("INSERT INTO locations (short_code, name, description) VALUES (:short_code, :name, :description)");
        if($stmt->execute([':short_code' => $short_code, ':name' => $name, ':description' => $description])) {
            $success = "Location created successfully!";
            logActivity($_SESSION['id'], 'create_location', "Created location: $name");
        } else {
            $error = "Failed to create location!";
        }
    }
}

// Fetch all locations with node count
$locations = $pdo->query("
    SELECT l.*, COUNT(n.id) as node_count
    FROM locations l
    LEFT JOIN nodes n ON l.id = n.location_id
    GROUP BY l.id
    ORDER BY l.created_at DESC
")->fetchAll(PDO::FETCH_ASSOC);

$page_title = "Locations";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>📍 Locations</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage datacenter locations</p>
        </div>
        <button onclick="document.getElementById('createModal').style.display='block'" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create Location
        </button>
    </div>

    <?php if($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    <?php if($error): ?>
        <div class="alert alert-danger"><?php echo $error; ?></div>
    <?php endif; ?>

    <!-- Locations Grid -->
    <div class="stats-grid">
        <?php foreach($locations as $location): ?>
        <div class="card fade-in">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                <div>
                    <h3 style="font-size: 20px; margin-bottom: 4px;"><?php echo htmlspecialchars($location['name']); ?></h3>
                    <code style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                        <?php echo $location['short_code']; ?>
                    </code>
                </div>
                <span class="badge badge-info"><?php echo $location['node_count']; ?> Nodes</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">
                <?php echo htmlspecialchars($location['description']); ?>
            </p>
            <div style="display: flex; gap: 8px;">
                <a href="/admin/nodes/list.php?location=<?php echo $location['id']; ?>" class="btn btn-secondary btn-sm">
                    <i class="fas fa-server"></i> View Nodes
                </a>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<!-- Create Location Modal -->
<div id="createModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; padding: 40px;">
    <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-header">
            <h3 class="card-title">Create New Location</h3>
            <button onclick="document.getElementById('createModal').style.display='none'" class="btn btn-sm">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
            
            <div class="form-group">
                <label class="form-label">Short Code *</label>
                <input type="text" name="short_code" class="form-control" placeholder="US-NY" required maxlength="10">
            </div>

            <div class="form-group">
                <label class="form-label">Location Name *</label>
                <input type="text" name="name" class="form-control" placeholder="New York, USA" required>
            </div>

            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-control" rows="3" placeholder="Primary datacenter in New York"></textarea>
            </div>

            <button type="submit" name="create_location" class="btn btn-primary">
                <i class="fas fa-save"></i> Create Location
            </button>
        </form>
    </div>
</div>

<?php include "../../includes/footer.php"; ?>
