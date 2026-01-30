<?php
// admin/plans/list.php
// VPS Plans Management
require_once "../../config.php";
require_once "../../includes/middleware.php";

requireAdmin();

$success = $error = "";

// Handle plan creation
if($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['create_plan'])) {
    if(verifyCSRFToken($_POST['csrf_token'])) {
        $name = sanitize($_POST['name']);
        $ram = (int)$_POST['ram'];
        $cpu_cores = (int)$_POST['cpu_cores'];
        $disk = (int)$_POST['disk'];
        $price = (float)$_POST['price'];
        
        $stmt = $pdo->prepare("INSERT INTO plans (name, ram, cpu_cores, disk, price) VALUES (:name, :ram, :cpu_cores, :disk, :price)");
        if($stmt->execute([
            ':name' => $name,
            ':ram' => $ram,
            ':cpu_cores' => $cpu_cores,
            ':disk' => $disk,
            ':price' => $price
        ])) {
            $success = "Plan created successfully!";
            logActivity($_SESSION['id'], 'create_plan', "Created plan: $name");
        } else {
            $error = "Failed to create plan!";
        }
    }
}

// Fetch all plans
$plans = $pdo->query("
    SELECT p.*, COUNT(s.id) as server_count
    FROM plans p
    LEFT JOIN servers s ON p.id = s.plan_id
    GROUP BY p.id
    ORDER BY p.price ASC
")->fetchAll(PDO::FETCH_ASSOC);

$page_title = "Plans";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>📦 VPS Plans</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage hosting plans</p>
        </div>
        <button onclick="document.getElementById('createPlanModal').style.display='block'" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create Plan
        </button>
    </div>

    <?php if($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    <?php if($error): ?>
        <div class="alert alert-danger"><?php echo $error; ?></div>
    <?php endif; ?>

    <!-- Plans Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
        <?php foreach($plans as $plan): ?>
        <div class="card fade-in">
            <div style="text-align: center; padding: 20px;">
                <h3 style="font-size: 24px; margin-bottom: 8px;"><?php echo htmlspecialchars($plan['name']); ?></h3>
                <div style="font-size: 36px; font-weight: 700; color: var(--accent-primary); margin: 16px 0;">
                    $<?php echo number_format($plan['price'], 2); ?>
                    <span style="font-size: 14px; color: var(--text-muted);">/mo</span>
                </div>
                
                <div style="text-align: left; margin: 20px 0;">
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 8px;">
                        <i class="fas fa-memory" style="color: var(--accent-primary); margin-right: 8px;"></i>
                        <strong><?php echo $plan['ram']; ?> MB</strong> RAM
                    </div>
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 8px;">
                        <i class="fas fa-microchip" style="color: var(--accent-primary); margin-right: 8px;"></i>
                        <strong><?php echo $plan['cpu_cores']; ?></strong> CPU Cores
                    </div>
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-hdd" style="color: var(--accent-primary); margin-right: 8px;"></i>
                        <strong><?php echo $plan['disk']; ?> GB</strong> Disk
                    </div>
                </div>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                    <span class="badge badge-info"><?php echo $plan['server_count']; ?> Servers</span>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<!-- Create Plan Modal -->
<div id="createPlanModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; padding: 40px; overflow-y: auto;">
    <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-header">
            <h3 class="card-title">Create New Plan</h3>
            <button onclick="document.getElementById('createPlanModal').style.display='none'" class="btn btn-sm">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
            
            <div class="form-group">
                <label class="form-label">Plan Name *</label>
                <input type="text" name="name" class="form-control" placeholder="Basic VPS" required>
            </div>

            <div class="form-group">
                <label class="form-label">RAM (MB) *</label>
                <input type="number" name="ram" class="form-control" placeholder="2048" required>
            </div>

            <div class="form-group">
                <label class="form-label">CPU Cores *</label>
                <input type="number" name="cpu_cores" class="form-control" placeholder="2" required>
            </div>

            <div class="form-group">
                <label class="form-label">Disk (GB) *</label>
                <input type="number" name="disk" class="form-control" placeholder="50" required>
            </div>

            <div class="form-group">
                <label class="form-label">Price ($/month) *</label>
                <input type="number" step="0.01" name="price" class="form-control" placeholder="9.99" required>
            </div>

            <button type="submit" name="create_plan" class="btn btn-primary">
                <i class="fas fa-save"></i> Create Plan
            </button>
        </form>
    </div>
</div>

<style>
.alert-success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid var(--accent-success);
    color: var(--accent-success);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
}
.alert-danger {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--accent-danger);
    color: var(--accent-danger);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
}
</style>

<?php include "../../includes/footer.php"; ?>
