import shutil
import os
from datetime import datetime
from pathlib import Path

# Configuration
DB_FILE_NAME = 'db.sqlite3'
BACKUP_FOLDER_NAME = 'backups'

def backup():
    # 1. Determine paths based on where this script lives
    # Script is in: backend/graftapi/scripts/
    script_dir = Path(__file__).resolve().parent
    
    # Root is two levels up: backend/
    project_root = script_dir.parent.parent
    
    db_path = project_root / DB_FILE_NAME
    backup_dir = project_root / BACKUP_FOLDER_NAME

    # 2. Verify Database exists
    if not db_path.exists():
        print(f"Error: Could not find database at: {db_path}")
        print("Check if 'db.sqlite3' is actually in the 'backend' folder.")
        return

    # 3. Create backup directory if it doesn't exist
    backup_dir.mkdir(exist_ok=True)

    # 4. Create timestamped filename
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    destination = backup_dir / f"db_backup_{timestamp}.sqlite3"

    # 5. Copy the file
    try:
        shutil.copy2(db_path, destination)
        print(f"Database backed up successfully!")
        print(f"Saved to: {destination}")
    except Exception as e:
        print(f"Backup failed: {e}")

if __name__ == "__main__":
    backup()