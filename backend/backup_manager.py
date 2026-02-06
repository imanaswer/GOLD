#!/usr/bin/env python3
"""
MongoDB Backup Manager for Gold ERP System
Render-safe, production-ready
"""

import os
import subprocess
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
import shutil
from dotenv import load_dotenv

# -------------------------------------------------------------------
# ENV & PATH SETUP
# -------------------------------------------------------------------

BASE_DIR = Path(os.getcwd())
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

BACKUP_DIR = BASE_DIR / "backups"
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "mongodb_backup.log"

RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", 7))
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URL or not DB_NAME:
    raise RuntimeError("Missing required env vars: MONGO_URL or DB_NAME")

# Ensure directories exist
BACKUP_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------------
# LOGGING (Render-safe)
# -------------------------------------------------------------------

handlers = [logging.StreamHandler()]

# Only log to file if NOT on Render
if not os.getenv("RENDER"):
    handlers.append(logging.FileHandler(LOG_FILE))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=handlers
)

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# BACKUP MANAGER
# -------------------------------------------------------------------

class BackupManager:
    def __init__(self):
        self.backup_dir = BACKUP_DIR
        self.mongo_url = MONGO_URL
        self.db_name = DB_NAME

    def create_backup(self):
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        name = f"backup_{timestamp}"
        dump_path = self.backup_dir / name
        archive_path = self.backup_dir / f"{name}.tar.gz"

        try:
            logger.info(f"Creating backup: {name}")

            result = subprocess.run(
                [
                    "mongodump",
                    f"--uri={self.mongo_url}",
                    f"--db={self.db_name}",
                    f"--out={dump_path}",
                    "--quiet"
                ],
                capture_output=True,
                text=True,
                timeout=600
            )

            if result.returncode != 0:
                raise RuntimeError(result.stderr)

            shutil.make_archive(str(dump_path), "gztar", dump_path)
            shutil.rmtree(dump_path)

            size_mb = archive_path.stat().st_size / (1024 * 1024)
            logger.info(f"Backup created: {archive_path.name} ({size_mb:.2f} MB)")

            self.cleanup_old_backups()

            return {
                "success": True,
                "file": archive_path.name,
                "size_mb": round(size_mb, 2)
            }

        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return {"success": False, "error": str(e)}

    def cleanup_old_backups(self):
        cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)

        for f in self.backup_dir.glob("backup_*.tar.gz"):
            ts = f.name.replace("backup_", "").replace(".tar.gz", "")
            try:
                dt = datetime.strptime(ts, "%Y%m%d_%H%M%S").replace(tzinfo=timezone.utc)
                if dt < cutoff:
                    f.unlink()
                    logger.info(f"Deleted old backup: {f.name}")
            except Exception:
                pass

    def list_backups(self):
        backups = []
        for f in sorted(self.backup_dir.glob("backup_*.tar.gz"), reverse=True):
            size_mb = f.stat().st_size / (1024 * 1024)
            backups.append({
                "file": f.name,
                "size_mb": round(size_mb, 2)
            })
        return backups

# -------------------------------------------------------------------
# CLI SUPPORT
# -------------------------------------------------------------------

def main():
    manager = BackupManager()
    import sys

    if len(sys.argv) > 1:
        cmd = sys.argv[1]

        if cmd == "backup":
            print(manager.create_backup())
        elif cmd == "list":
            print(manager.list_backups())
        else:
            print("Unknown command")
    else:
        print(manager.create_backup())

if __name__ == "__main__":
    main()
