import shutil
import os
import sys
from pathlib import Path

# Configuration
DB_FILE_NAME = 'db.sqlite3'
BACKUP_FOLDER_NAME = 'backups'

def restore():
    # 1. Determine paths
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent
    
    db_path = project_root / DB_FILE_NAME
    backup_dir = project_root / BACKUP_FOLDER_NAME

    # 2. Check for backups
    if not backup_dir.exists() or not any(backup_dir.iterdir()):
        print(f"No backups found in: {backup_dir}")
        return

    # Filter only sqlite3 files and sort by date (newest first)
    backups = sorted(
        [f for f in backup_dir.glob('*.sqlite3') if "SAFETY" not in f.name], 
        key=os.path.getmtime, 
        reverse=True
    )

    if not backups:
        print("No valid backup files found.")
        return

    print(f"\n📂 Backups found in {backup_dir}:")
    for i, f in enumerate(backups):
        size_kb = f.stat().st_size / 1024
        print(f"{i + 1}: {f.name}  ({size_kb:.1f} KB)")

    # 3. User Selection
    choice = input("\nEnter number to restore (or 'q' to quit): ")
    if choice.lower() == 'q':
        return

    try:
        selected_file = backups[int(choice) - 1]
    except (ValueError, IndexError):
        print("Invalid selection.")
        return

    # 4. Safety Backup (in case you regret the restore)
    if db_path.exists():
        print("\n Creating safety backup of current state...")
        safety_name = backup_dir / f"SAFETY_BEFORE_RESTORE_{datetime.now().strftime('%H%M%S')}.sqlite3"
        shutil.copy2(db_path, safety_name)

    # 5. Restore
    print(f"Restoring '{selected_file.name}'...")
    try:
        shutil.copy2(selected_file, db_path)
        print("Restore complete!")
        print("Remember to restart your Django server!")
    except Exception as e:
        print(f"Restore failed: {e}")

if __name__ == "__main__":
    from datetime import datetime # Import needed inside for the safety timestamp
    restore()