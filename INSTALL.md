# VPS Installation Guide (Ubuntu/Debian)

This guide walks you through deploying the VPS Panel on a generic Ubuntu 20.04/22.04 VPS using a LAMP stack (Linux, Apache, MySQL, PHP).

## Prerequisites
- A VPS with Ubuntu 20.04 or newer.
- Root or sudo access.
- Basic familiarity with the command line.

## Step 1: Update System & Install Dependencies
Update your package list and install Apache, MySQL, PHP, and necessary PHP extensions.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install apache2 mysql-server php php-mysql php-cli libapache2-mod-php unzip git -y
```

## Step 2: Configure the Database
1.  **Secure MySQL installation** (Optional but recommended):
    ```bash
    sudo mysql_secure_installation
    ```
    Follow the prompts to set a root password and remove insecure defaults.

2.  **Create Database and User**:
    Log in to MySQL:
    ```bash
    sudo mysql -u root -p
    ```
    Run the following SQL commands (replace `your_password` with a strong password):
    ```sql
    CREATE DATABASE vps_panel;
    CREATE USER 'panel_user'@'localhost' IDENTIFIED BY 'your_password';
    GRANT ALL PRIVILEGES ON vps_panel.* TO 'panel_user'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```

3.  **Import the Schema**:
    Navigate to the project directory (after Step 3) or manually paste the contents of `database.sql`:
    ```bash
    mysql -u panel_user -p vps_panel < database.sql
    ```

## Step 3: Deploy the Code
1.  **Clone the Repository**:
    Navigate to the web root:
    ```bash
    cd /var/www/html
    ```
    Clone your repository (replace with your actual repo URL):
    ```bash
    sudo git clone https://github.com/Alfha240/vps-panel.git
    ```

2.  **Set Permissions**:
    Ensure Apache handles these files:
    ```bash
    sudo chown -R www-data:www-data /var/www/html/vps-panel
    sudo chmod -R 755 /var/www/html/vps-panel
    ```

## Step 4: Configure the Application
1.  **Update Config**:
    Edit the `config.php` file to match your new database credentials:
    ```bash
    sudo nano /var/www/html/vps-panel/config.php
    ```
    Update these lines:
    ```php
    define('DB_SERVER', 'localhost');
    define('DB_USERNAME', 'panel_user');
    define('DB_PASSWORD', 'your_password');
    define('DB_NAME', 'vps_panel');
    ```
    Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## Step 5: Configure Apache
1.  **Create a Virtual Host**:
    create a new config file:
    ```bash
    sudo nano /etc/apache2/sites-available/vps-panel.conf
    ```
    Paste the following configuration (replace `your-domain.com` with your domain or VPS IP):
    ```apache
    <VirtualHost *:80>
        ServerAdmin admin@your-domain.com
        DocumentRoot /var/www/html/vps-panel
        ServerName your-domain.com

        <Directory /var/www/html/vps-panel>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
    </VirtualHost>
    ```

2.  **Enable the Site**:
    ```bash
    sudo a2ensite vps-panel.conf
    sudo a2enmod rewrite
    sudo systemctl restart apache2
    ```

## Step 6: Access the Panel
Open your browser and navigate to `http://your-domain.com` (or your VPS IP). You should see the login page.
