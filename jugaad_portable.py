#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Jugaad Backup — Portable Edition v2.0.0
======================================
A comprehensive Python application for project code backup and rehydration.

Author: v3nd377a.5y573m5
License: MIT
Version: 2.0.0
"""

import os
import sys
import subprocess
import importlib

# =============================================================================
# BOOTSTRAPPER
# =============================================================================

REQUIRED_PACKAGES = {
    "rich": "rich",
    "yaml": "PyYAML",
    "pathspec": "pathspec",
    "pyperclip": "pyperclip",
    "textual": "textual>=0.47.0",
    "cryptography": "cryptography>=41.0.0",
}

BOOTSTRAP_ENV_VAR = "JUGAAD_BOOTSTRAP_DONE"
VERSION = "2.0.0"
AUTHOR = "v3nd377a.5y573m5"

# ASCII Art Header - EXACTLY from user's file
HEADER_ART = """#####################################################################
#    __  _____  _____  _____  _____  ____       _____  _____  _____ #
# __|  ||  |  ||   __||  _  ||  _  ||    \\     | __  ||  |  ||  _  |#
#|  |  ||  |  ||  |  ||     ||     ||  |  |    | __ -||    -||   __|#
#|_____||_____||_____||__|__||__|__||____/     |_____||__|__||__|   #
#####################################################################"""

def ensure_dependencies():
    """Install missing dependencies."""
    if os.environ.get(BOOTSTRAP_ENV_VAR) == "1":
        return

    missing = []
    for module_name, pip_name in REQUIRED_PACKAGES.items():
        try:
            importlib.import_module(module_name.split(">")[0].split("=")[0])
        except ImportError:
            missing.append(pip_name)

    if not missing:
        return

    print(f"[!] Missing {len(missing)} dependencies: {', '.join(missing)}")
    
    is_venv = (sys.prefix != sys.base_prefix)
    
    if is_venv:
        print("[*] Installing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)
        os.execv(sys.executable, [sys.executable] + sys.argv)
    else:
        print("[!] Creating private environment...")
        venv_dir = os.path.join(os.getcwd(), ".jugaad_venv")
        python_exe = os.path.join(venv_dir, "Scripts" if sys.platform == "win32" else "bin", "python")
        
        if not os.path.exists(python_exe):
            subprocess.check_call([sys.executable, "-m", "venv", venv_dir])
        
        subprocess.check_call([python_exe, "-m", "pip", "install", "-q"] + missing)
        env = os.environ.copy()
        env[BOOTSTRAP_ENV_VAR] = "1"
        os.execv(python_exe, [python_exe] + sys.argv)


if __name__ == "__main__":
    ensure_dependencies()

# =============================================================================
# IMPORTS
# =============================================================================

import shutil
import glob
import re
import datetime
import base64
import hashlib
import zlib
import socket
import argparse
import json
import dataclasses
import secrets
import platform
import getpass
import tempfile
from typing import List, Dict, Any, Optional, Tuple, Callable
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import time

try:
    import yaml
    from pathspec import PathSpec
    from pathspec.patterns import GitWildMatchPattern
    import pyperclip
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from rich.console import Console
    from rich.text import Text
    from textual.app import App, ComposeResult
    from textual.containers import Container, Horizontal, Vertical, VerticalScroll
    from textual.widgets import (
        Header, Footer, Static, Button, DataTable, 
        Label, ListView, ListItem, Input, RichLog, ProgressBar
    )
    from textual.screen import ModalScreen, Screen
    from textual.binding import Binding
    from textual.reactive import reactive
    from textual import events
except ImportError as e:
    print(f"[x] Critical: Missing dependency - {e}")
    sys.exit(1)

# =============================================================================
# CONSTANTS
# =============================================================================

JUGAAD_DIR_NAME = ".JugaadBKP"
TOON_SUBDIR = "TOON"
PROJECTS_CONFIG_FILE = os.path.expanduser("~/.jugaad/projects.json")
MASTER_KEY_FILE = os.path.expanduser("~/.jugaad/master.key")

DEFAULT_IGNORED_PATTERNS = [
    "*.pyc", "__pycache__/", ".ipynb_checkpoints/", ".pytest_cache/",
    ".venv/", "venv/", "env/", "node_modules/", "target/", "build/", "dist/", "out/",
    ".git/", ".hg/", ".svn/", ".idea/", ".vscode/", ".terraform/", "cdktf.out/",
    "*.log", "*.tmp", "*.temp", "*.bak", "*.swp", "*.exe", "*.dll", "*.so", "*.dylib", "*.o",
    ".DS_Store", ".env", "*.env", "*.iml", "thumbs.db",
    "LICENSE", "LICENSE.txt", "README.md", "README.rst",
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".jugaad_venv/",
]

INCLUDED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte",
    ".java", ".kt", ".scala", ".go", ".rs", ".rb", ".php", ".swift",
    ".c", ".cpp", ".h", ".hpp", ".cs", ".h", ".m", ".mm",
    ".html", ".htm", ".css", ".scss", ".sass", ".less",
    ".json", ".yaml", ".yml", ".xml", ".toml", ".ini", ".conf", ".cfg",
    ".md", ".rst", ".txt", ".sh", ".bash", ".zsh", ".ps1", ".bat",
    ".tf", ".hcl", ".sql", ".prisma", ".graphql", ".gql",
    ".dockerfile", "Dockerfile", "Makefile", "Jenkinsfile",
    "package.json", "go.mod", "Cargo.toml", "pyproject.toml",
    "requirements.txt", "main.tf", "variables.tf", "outputs.tf",
}

# =============================================================================
# LOGGING
# =============================================================================

def log(msg: str, console=None, style: str = "green"):
    if console:
        console.print(f"[{style}]{msg}[/{style}]")
    else:
        print(msg)

def log_error(msg: str, console=None):
    if console:
        console.print(f"[red][x] {msg}[/red]")
    else:
        print(f"[x] {msg}", file=sys.stderr)

def log_warning(msg: str, console=None):
    if console:
        console.print(f"[yellow][!] {msg}[/yellow]")
    else:
        print(f"[!] {msg}")

# =============================================================================
# STATE
# =============================================================================

@dataclasses.dataclass
class GlobalState:
    project_root: str = ""
    project_name: str = ""
    hostname: str = dataclasses.field(default_factory=socket.gethostname)
    backup_timestamp: str = ""
    backup_date: str = ""
    backup_version: str = ""
    backup_file_path: str = ""
    included_log_path: str = ""
    skipped_log_path: str = ""
    total_scanned: int = 0
    total_included: int = 0
    total_skipped: int = 0
    file_details: List[Dict] = dataclasses.field(default_factory=list)
    encryption_enabled: bool = False
    encryption_password: str = ""
    respect_gitignore: bool = True
    use_compression: bool = True
    backup_notes: str = ""
    backup_tags: List[str] = dataclasses.field(default_factory=list)

# =============================================================================
# FEATURE 1-5: ENCRYPTION MODULE (Root Password Integration)
# =============================================================================

class SecureEncryption:
    """
    AES-128 Fernet encryption with root/system password integration.
    Feature 1: Root password encryption
    Feature 2: System keyring support (optional)
    Feature 3: Machine-specific key derivation
    """
    
    @staticmethod
    def get_machine_id() -> str:
        """Get unique machine identifier."""
        try:
            # Combine multiple machine-specific identifiers
            machine_id = f"{platform.node()}-{platform.machine()}-{hashlib.sha256(platform.platform().encode()).hexdigest()[:16]}"
            return hashlib.sha256(machine_id.encode()).hexdigest()
        except:
            return "default-machine-id"
    
    @staticmethod
    def derive_key_from_system(password: str = None, salt: bytes = None) -> Tuple[bytes, bytes]:
        """Derive encryption key from system + optional password."""
        if salt is None:
            salt = secrets.token_bytes(16)
        
        # Combine machine ID with optional user password
        base_secret = SecureEncryption.get_machine_id()
        if password:
            base_secret = f"{base_secret}:{password}"
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(base_secret.encode()))
        return key, salt
    
    @staticmethod
    def encrypt_data(data: str, password: str = None) -> bytes:
        """Encrypt data with system + optional password."""
        key, salt = SecureEncryption.derive_key_from_system(password)
        fernet = Fernet(key)
        encrypted = fernet.encrypt(data.encode('utf-8'))
        return salt + encrypted
    
    @staticmethod
    def decrypt_data(encrypted_data: bytes, password: str = None) -> str:
        """Decrypt data with system + optional password."""
        salt = encrypted_data[:16]
        encrypted = encrypted_data[16:]
        key, _ = SecureEncryption.derive_key_from_system(password, salt)
        fernet = Fernet(key)
        return fernet.decrypt(encrypted).decode('utf-8')
    
    @staticmethod
    def is_encrypted(file_path: str) -> bool:
        """Check if file is encrypted."""
        try:
            with open(file_path, 'rb') as f:
                header = f.readline()
                return header.startswith(b'JUGAAD_ENCRYPTED')
        except:
            return False
    
    @staticmethod
    def encrypt_file(input_path: str, output_path: str, password: str = None):
        """Encrypt a file."""
        with open(input_path, 'rb') as f:
            data = f.read().decode('utf-8')
        
        encrypted = SecureEncryption.encrypt_data(data, password)
        
        with open(output_path, 'wb') as f:
            f.write(b'JUGAAD_ENCRYPTED_v2\n')
            f.write(encrypted)
    
    @staticmethod
    def decrypt_file(input_path: str, output_path: str, password: str = None):
        """Decrypt a file."""
        with open(input_path, 'rb') as f:
            header = f.readline()
            if not header.startswith(b'JUGAAD_ENCRYPTED'):
                raise ValueError("Not an encrypted Jugaad backup")
            encrypted = f.read()
        
        decrypted = SecureEncryption.decrypt_data(encrypted, password)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(decrypted)


# =============================================================================
# FEATURE 6: BACKUP COMPRESSION
# =============================================================================

class BackupCompression:
    """Feature 6: Compression support for backups."""
    
    @staticmethod
    def compress_data(data: bytes) -> bytes:
        """Compress data using zlib."""
        return zlib.compress(data, level=6)
    
    @staticmethod
    def decompress_data(data: bytes) -> bytes:
        """Decompress data."""
        return zlib.decompress(data)
    
    @staticmethod
    def compress_file(input_path: str, output_path: str):
        """Compress a file."""
        with open(input_path, 'rb') as f:
            data = f.read()
        compressed = BackupCompression.compress_data(data)
        with open(output_path, 'wb') as f:
            f.write(b'JUGAAD_COMPRESSED\n')
            f.write(compressed)


# =============================================================================
# FEATURE 7: INTEGRITY VERIFICATION
# =============================================================================

class IntegrityVerifier:
    """Feature 7: SHA256 integrity verification."""
    
    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """Calculate SHA256 hash of file."""
        h = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()
    
    @staticmethod
    def verify_backup_integrity(backup_path: str, console=None) -> Tuple[bool, List[Dict]]:
        """Verify integrity of all files in backup."""
        results = []
        all_valid = True
        
        with open(backup_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Skip encrypted files for now
        if SecureEncryption.is_encrypted(backup_path):
            log_warning("Cannot verify encrypted backup integrity without decryption", console)
            return True, [{"status": "encrypted", "message": "Decrypt first to verify"}]
        
        pos = 0
        while True:
            s_match = re.search(r"^--- FILE START: (.*) ---\n", content[pos:], re.MULTILINE)
            if not s_match:
                break
            
            file_path = s_match.group(1).strip()
            start_c = pos + s_match.end()
            
            stored_hash = None
            if m := re.match(r"^SHA256: ([^\n]+)\n", content[start_c:]):
                stored_hash = m.group(1)
                start_c += m.end()
            
            e_match = re.search(r"^--- FILE END: .* ---\n", content[start_c:], re.MULTILINE)
            if not e_match:
                break
            
            file_content = content[start_c:start_c + e_match.start()]
            
            # Calculate actual hash
            actual_hash = hashlib.sha256(file_content.encode()).hexdigest()
            
            valid = (stored_hash == actual_hash) if stored_hash else True
            if not valid:
                all_valid = False
            
            results.append({
                "path": file_path,
                "stored_hash": stored_hash,
                "actual_hash": actual_hash,
                "valid": valid
            })
            
            pos = start_c + e_match.end()
        
        return all_valid, results


# =============================================================================
# FEATURE 8: BACKUP DIFF
# =============================================================================

class BackupDiffer:
    """Feature 8: Compare two backups."""
    
    @staticmethod
    def get_backup_file_list(backup_path: str) -> Dict[str, Dict]:
        """Get file list from backup with metadata."""
        files = {}
        
        if SecureEncryption.is_encrypted(backup_path):
            return {"error": "Encrypted backup - decrypt first"}
        
        with open(backup_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        m_end = re.search(r'--- END MANIFEST ---\n\n?', content)
        if not m_end:
            return files
        
        try:
            manifest = yaml.safe_load(content[:m_end.start()])
            for f in manifest.get("Included Files", []):
                if isinstance(f, dict):
                    files[f["path"]] = {
                        "sha256": f.get("sha256", ""),
                        "size": f.get("size", 0)
                    }
        except:
            pass
        
        return files
    
    @staticmethod
    def compare_backups(backup1: str, backup2: str) -> Dict:
        """Compare two backups."""
        files1 = BackupDiffer.get_backup_file_list(backup1)
        files2 = BackupDiffer.get_backup_file_list(backup2)
        
        added = []
        removed = []
        modified = []
        unchanged = []
        
        all_paths = set(files1.keys()) | set(files2.keys())
        
        for path in all_paths:
            if path not in files1:
                added.append(path)
            elif path not in files2:
                removed.append(path)
            elif files1[path]["sha256"] != files2[path]["sha256"]:
                modified.append(path)
            else:
                unchanged.append(path)
        
        return {
            "added": added,
            "removed": removed,
            "modified": modified,
            "unchanged": unchanged,
            "stats": {
                "total_added": len(added),
                "total_removed": len(removed),
                "total_modified": len(modified),
                "total_unchanged": len(unchanged)
            }
        }


# =============================================================================
# FEATURE 9: BACKUP ROTATION
# =============================================================================

class BackupRotator:
    """Feature 9: Auto-rotate old backups."""
    
    @staticmethod
    def rotate_backups(project_root: str, keep_days: int = 30, keep_count: int = 10, console=None) -> int:
        """Delete backups older than X days, keeping at least Y."""
        bkp_dir = os.path.join(project_root, JUGAAD_DIR_NAME, "3dev")
        if not os.path.isdir(bkp_dir):
            return 0
        
        backups = sorted(glob.glob(os.path.join(bkp_dir, "*.3dev")), key=os.path.getmtime, reverse=True)
        
        deleted = 0
        cutoff = datetime.datetime.now() - datetime.timedelta(days=keep_days)
        
        for i, backup in enumerate(backups):
            if i < keep_count:
                continue
            
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(backup))
            if mtime < cutoff:
                try:
                    os.remove(backup)
                    deleted += 1
                    log(f"[+] Rotated: {os.path.basename(backup)}", console, style="yellow")
                except:
                    pass
        
        return deleted


# =============================================================================
# FEATURE 10-15: FILE FILTERING
# =============================================================================

class FileFilter:
    """Feature 10-15: Advanced file filtering."""
    
    def __init__(self):
        self.include_patterns = []
        self.exclude_patterns = []
        self.min_size = 0
        self.max_size = float('inf')
        self.date_after = None
        self.date_before = None
    
    def add_include(self, pattern: str):
        self.include_patterns.append(pattern)
    
    def add_exclude(self, pattern: str):
        self.exclude_patterns.append(pattern)
    
    def set_size_range(self, min_bytes: int = 0, max_bytes: int = None):
        self.min_size = min_bytes
        self.max_size = max_bytes or float('inf')
    
    def set_date_range(self, after: datetime.datetime = None, before: datetime.datetime = None):
        self.date_after = after
        self.date_before = before
    
    def matches(self, file_path: str, size: int, mtime: datetime.datetime) -> bool:
        """Check if file matches all filters."""
        # Size filter
        if size < self.min_size or size > self.max_size:
            return False
        
        # Date filter
        if self.date_after and mtime < self.date_after:
            return False
        if self.date_before and mtime > self.date_before:
            return False
        
        # Pattern filters
        import fnmatch
        if self.include_patterns:
            if not any(fnmatch.fnmatch(file_path, p) for p in self.include_patterns):
                return False
        
        if self.exclude_patterns:
            if any(fnmatch.fnmatch(file_path, p) for p in self.exclude_patterns):
                return False
        
        return True


# =============================================================================
# FEATURE 16-20: ADDITIONAL FEATURES
# =============================================================================

class BackupScheduler:
    """Feature 16: Backup scheduling info."""
    
    @staticmethod
    def get_cron_expression(interval: str) -> str:
        """Convert interval to cron expression."""
        intervals = {
            "hourly": "0 * * * *",
            "daily": "0 0 * * *",
            "weekly": "0 0 * * 0",
            "monthly": "0 0 1 * *",
        }
        return intervals.get(interval, "0 0 * * *")


class BackupAnnotator:
    """Feature 17: Backup annotations."""
    
    @staticmethod
    def add_annotation(backup_path: str, notes: str, tags: List[str]):
        """Add notes and tags to backup."""
        pass  # Implemented in build_backup


class SizeEstimator:
    """Feature 18: Backup size estimation."""
    
    @staticmethod
    def estimate_backup_size(project_root: str, respect_gitignore: bool = True) -> Dict:
        """Estimate backup size before creating."""
        total_files = 0
        total_size = 0
        by_extension = {}
        
        gitignore = os.path.join(project_root, ".gitignore")
        git_spec = None
        if os.path.exists(gitignore) and respect_gitignore:
            with open(gitignore, 'r') as f:
                git_spec = PathSpec.from_lines(GitWildMatchPattern, f)
        
        explicit_spec = PathSpec.from_lines(GitWildMatchPattern, DEFAULT_IGNORED_PATTERNS)
        
        for root, dirs, files in os.walk(project_root, topdown=True):
            if JUGAAD_DIR_NAME in dirs:
                dirs.remove(JUGAAD_DIR_NAME)
            
            rel_root = os.path.relpath(root, project_root)
            if rel_root == ".":
                rel_root = ""
            
            for d in list(dirs):
                fp = os.path.join(rel_root, d)
                if explicit_spec.match_file(fp + '/') or (git_spec and git_spec.match_file(fp + '/')):
                    dirs.remove(d)
            
            for f in files:
                fp_rel = os.path.join(rel_root, f)
                fp_abs = os.path.join(root, f)
                
                if explicit_spec.match_file(fp_rel) or (git_spec and git_spec.match_file(fp_rel)):
                    continue
                
                ext = os.path.splitext(f)[1].lower()
                if ext not in INCLUDED_EXTENSIONS:
                    continue
                
                try:
                    size = os.path.getsize(fp_abs)
                    total_files += 1
                    total_size += size
                    by_extension[ext] = by_extension.get(ext, 0) + size
                except:
                    pass
        
        return {
            "total_files": total_files,
            "total_size": total_size,
            "total_size_human": human_size(total_size),
            "by_extension": {k: human_size(v) for k, v in by_extension.items()},
            "estimated_compressed": human_size(int(total_size * 0.3))  # Rough estimate
        }


class QuickActions:
    """Feature 19: Quick action shortcuts."""
    
    ACTIONS = {
        "ctrl+b": "backup_full",
        "ctrl+i": "backup_incremental",
        "ctrl+r": "rehydrate",
        "ctrl+t": "toon_export",
        "ctrl+q": "quit",
    }


class BackupValidator:
    """Feature 20: Deep backup validation."""
    
    @staticmethod
    def validate_backup(backup_path: str) -> Dict:
        """Deep validation of backup structure."""
        results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "stats": {}
        }
        
        if not os.path.exists(backup_path):
            results["valid"] = False
            results["errors"].append("File does not exist")
            return results
        
        if SecureEncryption.is_encrypted(backup_path):
            results["warnings"].append("Encrypted backup - limited validation")
            results["stats"]["encrypted"] = True
            return results
        
        try:
            with open(backup_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check manifest
            if "--- END MANIFEST ---" not in content:
                results["valid"] = False
                results["errors"].append("Missing manifest end marker")
            
            # Count files
            file_starts = content.count("--- FILE START:")
            file_ends = content.count("--- FILE END:")
            
            if file_starts != file_ends:
                results["valid"] = False
                results["errors"].append(f"Mismatched file markers: {file_starts} starts, {file_ends} ends")
            
            results["stats"]["file_count"] = file_starts
            results["stats"]["file_size"] = os.path.getsize(backup_path)
            
        except Exception as e:
            results["valid"] = False
            results["errors"].append(f"Read error: {e}")
        
        return results


# =============================================================================
# UTILITIES
# =============================================================================

def detect_project_root() -> str:
    current = os.getcwd()
    markers = [".git", "pyproject.toml", "package.json", "Cargo.toml", "go.mod"]
    while current != os.path.dirname(current):
        for marker in markers:
            if os.path.exists(os.path.join(current, marker)):
                return current
        current = os.path.dirname(current)
    return os.getcwd()

def get_sha256(path: str) -> str:
    try:
        h = hashlib.sha256()
        with open(path, 'rb') as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()
    except IOError:
        return "N/A"

def human_size(n: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} PB"

def safe_filename(base: str, suffix: str, date: str, ver: str) -> str:
    name = f"{base}_{date}_{ver}{suffix}"
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', name)
    if len(name) > 120:
        digest = hashlib.sha1(name.encode()).hexdigest()[:10]
        name = f"{base[:20]}_{digest}{suffix}"
    return name

def validate_path(path: str, base: str) -> bool:
    try:
        return Path(os.path.abspath(os.path.join(base, path))).resolve().is_relative_to(Path(base).resolve())
    except:
        return False

def format_time_ago(dt: datetime.datetime) -> str:
    now = datetime.datetime.now()
    diff = now - dt
    if diff.days > 365:
        return f"{diff.days // 365}y ago"
    elif diff.days > 30:
        return f"{diff.days // 30}mo ago"
    elif diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600}h ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60}m ago"
    return "just now"

def get_backups_list(project_root: str) -> List[Dict]:
    backups = []
    bkp_dir = os.path.join(project_root, JUGAAD_DIR_NAME, "3dev")
    if not os.path.isdir(bkp_dir):
        return backups
    
    files = sorted(glob.glob(os.path.join(bkp_dir, "*.3dev")), key=os.path.getmtime, reverse=True)
    
    for f in files:
        try:
            stat = os.stat(f)
            is_encrypted = SecureEncryption.is_encrypted(f)
            
            manifest = {"encrypted": is_encrypted}
            if not is_encrypted:
                with open(f, 'r', encoding='utf-8', errors='ignore') as hf:
                    content = ""
                    for line in hf:
                        content += line
                        if "--- END MANIFEST ---" in line:
                            break
                    try:
                        yaml_str = content.replace("--- END MANIFEST ---", "").strip()
                        manifest = yaml.safe_load(yaml_str) or {}
                        manifest["encrypted"] = False
                    except:
                        pass
            
            backups.append({
                "path": f,
                "name": os.path.basename(f),
                "size": stat.st_size,
                "modified": datetime.datetime.fromtimestamp(stat.st_mtime),
                "version": manifest.get("::Backup Stats::", {}).get("Backup Version", manifest.get("Backup Version", "?")),
                "files": manifest.get("::Backup Stats::", {}).get("Files Included", manifest.get("Files Included", 0)),
                "hostname": manifest.get("::Project Info::", {}).get("Hostname", manifest.get("Hostname", "?")),
                "created_by": manifest.get("::Generation Info::", {}).get("Created By", "unknown"),
                "encrypted": is_encrypted,
                "notes": manifest.get("::Backup Stats::", {}).get("Notes", ""),
                "tags": manifest.get("::Backup Stats::", {}).get("Tags", []),
            })
        except:
            continue
    
    return backups

def get_gitignore_patterns(project_root: str) -> List[str]:
    """Get patterns from .gitignore file."""
    gitignore = os.path.join(project_root, ".gitignore")
    patterns = []
    if os.path.exists(gitignore):
        with open(gitignore, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    patterns.append(line)
    return patterns

def has_sensitive_patterns(gitignore_patterns: List[str]) -> bool:
    """Check if gitignore has sensitive file patterns."""
    sensitive_indicators = [
        '.env', 'secret', 'key', 'credential', 'password', 
        'api_key', 'token', 'auth', 'private'
    ]
    for pattern in gitignore_patterns:
        pattern_lower = pattern.lower()
        if any(indicator in pattern_lower for indicator in sensitive_indicators):
            return True
    return False


# =============================================================================
# INCREMENTAL BACKUP
# =============================================================================

def get_last_backup_hashes(project_root: str) -> Dict[str, str]:
    file_hashes = {}
    try:
        backup_dir = os.path.join(project_root, JUGAAD_DIR_NAME, "3dev")
        if not os.path.isdir(backup_dir):
            return file_hashes
        
        backups = glob.glob(os.path.join(backup_dir, "*.3dev"))
        if not backups:
            return file_hashes
        
        for bk in sorted(backups, key=os.path.getmtime, reverse=True):
            if not SecureEncryption.is_encrypted(bk):
                with open(bk, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                manifest_match = re.search(r'--- END MANIFEST ---', content)
                if manifest_match:
                    yaml_str = content[:manifest_match.start()]
                    manifest = yaml.safe_load(yaml_str)
                    
                    if manifest and "Included Files" in manifest:
                        for file_info in manifest["Included Files"]:
                            if isinstance(file_info, dict):
                                file_hashes[file_info.get("path", "")] = file_info.get("sha256", "")
                break
    except:
        pass
    
    return file_hashes

def detect_changed_files(project_root: str, current_files: List[Dict], console=None) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    last_hashes = get_last_backup_hashes(project_root)
    
    if not last_hashes:
        return current_files, [], []
    
    added, modified, unchanged = [], [], []
    
    for file_info in current_files:
        path = file_info["path"]
        current_hash = file_info.get("sha256", "")
        
        if path not in last_hashes:
            added.append(file_info)
        elif last_hashes[path] != current_hash:
            modified.append(file_info)
        else:
            unchanged.append(file_info)
    
    return added, modified, unchanged


# =============================================================================
# SCAN PHASE
# =============================================================================

def scan_phase(state: GlobalState, console=None):
    log("[+] Scanning project tree...", console)
    
    gitignore = os.path.join(state.project_root, ".gitignore")
    git_spec = None
    if os.path.exists(gitignore) and state.respect_gitignore:
        with open(gitignore, 'r') as f:
            git_spec = PathSpec.from_lines(GitWildMatchPattern, f)
    
    explicit_spec = PathSpec.from_lines(GitWildMatchPattern, DEFAULT_IGNORED_PATTERNS)
    
    included, skipped = [], []
    
    for root, dirs, files in os.walk(state.project_root, topdown=True):
        if JUGAAD_DIR_NAME in dirs:
            dirs.remove(JUGAAD_DIR_NAME)
        if ".jugaad_venv" in dirs:
            dirs.remove(".jugaad_venv")
        
        rel_root = os.path.relpath(root, state.project_root)
        if rel_root == ".":
            rel_root = ""
        
        to_remove = []
        for d in dirs:
            fp = os.path.join(rel_root, d)
            if explicit_spec.match_file(fp + '/') or (git_spec and git_spec.match_file(fp + '/')):
                skipped.append(fp + '/')
                to_remove.append(d)
        for d in to_remove:
            dirs.remove(d)
        
        for f in files:
            state.total_scanned += 1
            
            fp_rel = os.path.join(rel_root, f)
            fp_abs = os.path.join(root, f)
            
            if explicit_spec.match_file(fp_rel) or (git_spec and git_spec.match_file(fp_rel)):
                skipped.append(fp_rel)
                state.total_skipped += 1
                continue
            
            f_lower = f.lower()
            allowed = any(f_lower.endswith(ext) if ext.startswith('.') else f_lower == ext.lower() 
                         for ext in INCLUDED_EXTENSIONS)
            if not allowed:
                skipped.append(fp_rel)
                state.total_skipped += 1
                continue
            
            state.total_included += 1
            included.append(fp_rel)
            state.file_details.append({
                "path": fp_rel,
                "size": os.path.getsize(fp_abs),
                "sha256": get_sha256(fp_abs)
            })
    
    if state.included_log_path:
        os.makedirs(os.path.dirname(state.included_log_path), exist_ok=True)
        with open(state.included_log_path, 'w') as f:
            f.write('\n'.join(included) + '\n')
    if state.skipped_log_path:
        os.makedirs(os.path.dirname(state.skipped_log_path), exist_ok=True)
        with open(state.skipped_log_path, 'w') as f:
            f.write('\n'.join(skipped) + '\n')
    
    log(f"[+] Scan complete: {state.total_included} included, {state.total_skipped} skipped", console)


# =============================================================================
# BACKUP
# =============================================================================

def init_phase(state: GlobalState, console=None):
    log("[+] Initializing backup...", console)
    
    now = datetime.datetime.now()
    state.backup_timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    state.backup_date = now.strftime("%Y-%m-%d")
    
    jugaad_root = os.path.join(state.project_root, JUGAAD_DIR_NAME)
    for subdir in ["3dev", "skipped", "included", "rehydrated", "AIO_rehydrated", TOON_SUBDIR]:
        os.makedirs(os.path.join(jugaad_root, subdir), exist_ok=True)
    
    pattern = os.path.join(jugaad_root, "3dev", f"{state.project_name}_{state.backup_date}_v*.3dev")
    existing = glob.glob(pattern)
    ver = 1
    for b in existing:
        m = re.search(r'_v(\d+)(-inc)?\.3dev$', b)
        if m:
            ver = max(ver, int(m.group(1)) + 1)
    state.backup_version = f"v{ver}"
    
    state.backup_file_path = os.path.join(jugaad_root, "3dev", 
        safe_filename(state.project_name, ".3dev", state.backup_date, state.backup_version))
    state.included_log_path = os.path.join(jugaad_root, "included",
        safe_filename("included_files", ".log", state.backup_date, state.backup_version))
    state.skipped_log_path = os.path.join(jugaad_root, "skipped",
        safe_filename("skipped_files", ".log", state.backup_date, state.backup_version))

def build_backup(state: GlobalState, console=None, incremental: bool = False, encrypt: bool = False, password: str = ""):
    suffix = " (incremental)" if incremental else ""
    enc_suffix = " (encrypted)" if encrypt else ""
    log(f"[+] Building backup{suffix}{enc_suffix}...", console)
    
    tmp_path = state.backup_file_path + ".tmp"
    
    generation_time = datetime.datetime.now()
    manifest = {
        "::Jugaad Backup Metadata Manifest::": None,
        "::Generation Info::": {
            "Generator": "Jugaad Backup",
            "Generator Version": VERSION,
            "Created By": AUTHOR,
            "Generation Timestamp": generation_time.isoformat(),
            "Generation Date": generation_time.strftime("%Y-%m-%d"),
            "Generation Time": generation_time.strftime("%H:%M:%S"),
            "Source Path": state.project_root,
            "Source Hostname": state.hostname,
            "Backup Type": "Incremental" if incremental else "Full",
            "Encrypted": encrypt,
            "Respect Gitignore": state.respect_gitignore,
        },
        "::Project Info::": {
            "Project Name": state.project_name,
            "Project Root": state.project_root,
            "Hostname": state.hostname,
        },
        "::Backup Stats::": {
            "Backup Time": state.backup_timestamp,
            "Backup Version": state.backup_version + ("-inc" if incremental else ""),
            "Files Included": state.total_included,
            "Files Skipped": state.total_skipped,
            "Repo Size": human_size(sum(f['size'] for f in state.file_details)),
            "Total Bytes": sum(f['size'] for f in state.file_details),
            "Notes": state.backup_notes,
            "Tags": state.backup_tags,
        },
        "Included Files": state.file_details
    }
    
    content = yaml.dump(manifest, default_flow_style=False, sort_keys=False).strip() + "\n"
    content += "--- END MANIFEST ---\n\n"
    
    for fd in state.file_details:
        rp, ap = fd['path'], os.path.join(state.project_root, fd['path'])
        
        if not os.path.exists(ap):
            content += f"--- SKIPPED: {rp} ---\n\n"
            continue
        
        try:
            with open(ap, 'r', encoding='utf-8') as rf:
                file_content = rf.read()
        except UnicodeDecodeError:
            with open(ap, 'rb') as rbf:
                file_content = f"<BINARY:{base64.b64encode(rbf.read()).decode('ascii')}>"
        
        content += f"--- FILE START: {rp} ---\n"
        content += f"SHA256: {fd['sha256']}\n"
        content += f"SIZE: {fd['size']} bytes\n"
        content += file_content
        if not file_content.endswith('\n'):
            content += '\n'
        content += f"--- FILE END: {rp} ---\n\n"
    
    content += f"\n{'='*70}\n"
    content += f"  Generated by Jugaad Backup v{VERSION}\n"
    content += f"  Created by: {AUTHOR}\n"
    content += f"  Timestamp: {generation_time.isoformat()}\n"
    content += f"{'='*70}\n"
    
    if encrypt:
        encrypted = SecureEncryption.encrypt_data(content, password)
        with open(tmp_path, 'wb') as f:
            f.write(b'JUGAAD_ENCRYPTED_v2\n')
            f.write(encrypted)
    else:
        with open(tmp_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    shutil.move(tmp_path, state.backup_file_path)
    log(f"[+] Backup created: {state.backup_file_path}", console, style="bold green")


# =============================================================================
# REHYDRATE
# =============================================================================

def rehydrate(state: GlobalState, console=None, backup_path: str = None, mode: str = "tree", password: str = "", 
              selective_files: List[str] = None):
    log("[+] Starting rehydration...", console)
    
    bkp_dir = os.path.join(state.project_root, JUGAAD_DIR_NAME, "3dev")
    if not os.path.isdir(bkp_dir):
        log_error("No backup directory found", console)
        return
    
    if backup_path:
        selected = backup_path
    else:
        backups = sorted(glob.glob(os.path.join(bkp_dir, "*.3dev")), key=os.path.getmtime, reverse=True)
        if not backups:
            log_error("No backups found", console)
            return
        selected = backups[0]
    
    log(f"[+] Rehydrating from: {os.path.basename(selected)}", console)
    
    is_encrypted = SecureEncryption.is_encrypted(selected)
    
    if is_encrypted:
        if not password:
            log_error("Backup is encrypted. Password required.", console)
            return
        try:
            content = SecureEncryption.decrypt_data(open(selected, 'rb').read()[20:], password)
        except Exception as e:
            log_error(f"Decryption failed: {e}", console)
            return
    else:
        with open(selected, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    
    m_end = re.search(r'--- END MANIFEST ---\n\n?', content)
    if not m_end:
        log_error("Invalid backup format", console)
        return
    
    try:
        manifest = yaml.safe_load(content[:m_end.start()])
        backup_stats = manifest.get("::Backup Stats::", {})
        ver = backup_stats.get("Backup Version", manifest.get("Backup Version", "vX"))
        time_san = backup_stats.get("Backup Time", manifest.get("Backup Time", "")).replace(":", "").replace("-", "").replace(" ", "")
    except:
        ver, time_san = "vX", "Unknown"
    
    jugaad_root = os.path.join(state.project_root, JUGAAD_DIR_NAME)
    
    if mode == "aio":
        out_file = os.path.join(jugaad_root, "AIO_rehydrated", f"{state.project_name}_Rehydrated_{time_san}_{ver}.txt")
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        
        body = content[m_end.end():]
        output = []
        pos = 0
        
        while True:
            s_match = re.search(r"^--- FILE START: (.*) ---\n", body[pos:], re.MULTILINE)
            if not s_match:
                break
            rp = s_match.group(1).strip()
            start_c = pos + s_match.end()
            
            if selective_files and rp not in selective_files:
                pos = start_c
                continue
            
            if m := re.match(r"^SHA256: .*\n", body[start_c:]):
                start_c += m.end()
            if m := re.match(r"^SIZE: .*\n", body[start_c:]):
                start_c += m.end()
            
            e_match = re.search(r"^--- FILE END: .* ---\n\n?", body[start_c:], re.MULTILINE)
            if not e_match:
                break
            
            raw = body[start_c:start_c + e_match.start()]
            output.append(f"\n--- FILE: {rp} ---\n")
            output.append(raw)
            pos = start_c + e_match.end()
        
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(''.join(output))
        
        log(f"[+] Rehydrated to single file: {out_file}", console, style="bold green")
    
    else:
        out_dir = os.path.join(jugaad_root, "rehydrated", f"{state.project_name}_Rehydrated_{time_san}_{ver}")
        os.makedirs(out_dir, exist_ok=True)
        
        body = content[m_end.end():]
        pos, extracted = 0, 0
        
        while True:
            s_match = re.search(r"^--- FILE START: (.*) ---\n", body[pos:], re.MULTILINE)
            if not s_match:
                break
            
            rp = s_match.group(1).strip()
            
            if selective_files and rp not in selective_files:
                pos += s_match.end()
                continue
            
            if not validate_path(rp, out_dir):
                pos += s_match.end()
                continue
            
            start_c = pos + s_match.end()
            
            if m := re.match(r"^SHA256: .*\n", body[start_c:]):
                start_c += m.end()
            if m := re.match(r"^SIZE: .*\n", body[start_c:]):
                start_c += m.end()
            
            e_match = re.search(r"^--- FILE END: .* ---\n\n?", body[start_c:], re.MULTILINE)
            if not e_match:
                break
            
            raw = body[start_c:start_c + e_match.start()]
            
            if raw.startswith("<BINARY:") and raw.endswith(">"):
                try:
                    data = base64.b64decode(raw[8:-1])
                except:
                    data = raw.encode('utf-8')
            else:
                data = raw.encode('utf-8')
            
            tp = os.path.join(out_dir, rp)
            os.makedirs(os.path.dirname(tp), exist_ok=True)
            try:
                with open(tp, 'wb') as f:
                    f.write(data)
                extracted += 1
            except:
                pass
            
            pos = start_c + e_match.end()
        
        log(f"[+] Extracted {extracted} files to: {out_dir}", console, style="bold green")


# =============================================================================
# TOON EXPORT
# =============================================================================

def export_toon(state: GlobalState, console=None, backup_path: str = None, password: str = "") -> str:
    log("[+] Generating TOON export...", console)
    
    if backup_path:
        is_encrypted = SecureEncryption.is_encrypted(backup_path)
        
        if is_encrypted:
            if not password:
                log_error("Backup is encrypted. Password required.", console)
                return ""
            try:
                content = SecureEncryption.decrypt_data(open(backup_path, 'rb').read()[20:], password)
            except Exception as e:
                log_error(f"Decryption failed: {e}", console)
                return ""
        else:
            with open(backup_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        
        m_end = re.search(r'--- END MANIFEST ---\n\n?', content)
        if not m_end:
            log_error("Invalid backup format", console)
            return ""
        
        try:
            manifest = yaml.safe_load(content[:m_end.start()])
            files_list = manifest.get("Included Files", [])
            backup_stats = manifest.get("::Backup Stats::", {})
            gen_info = manifest.get("::Generation Info::", {})
        except:
            files_list = []
            backup_stats = {}
            gen_info = {}
        
        body = content[m_end.end():]
        entries, blocks = [], []
        pos = 0
        
        while True:
            s_match = re.search(r"^--- FILE START: (.*) ---\n", body[pos:], re.MULTILINE)
            if not s_match:
                break
            rp = s_match.group(1).strip()
            start_c = pos + s_match.end()
            
            sha = "N/A"
            if m := re.match(r"^SHA256: ([^\n]+)\n", body[start_c:]):
                sha = m.group(1)
                start_c += m.end()
            if m := re.match(r"^SIZE: [^\n]+\n", body[start_c:]):
                start_c += m.end()
            
            e_match = re.search(r"^--- FILE END: .* ---\n\n?", body[start_c:], re.MULTILINE)
            if not e_match:
                break
            
            raw = body[start_c:start_c + e_match.start()]
            
            is_binary = raw.startswith("<BINARY:")
            if is_binary:
                try:
                    raw_bytes = base64.b64decode(raw[8:-1])
                except:
                    raw_bytes = raw.encode('utf-8')
            else:
                raw_bytes = raw.encode('utf-8')
            
            if len(raw_bytes) > 1024 or b"---" in raw_bytes or b"===" in raw_bytes:
                content_out = base64.b64encode(zlib.compress(raw_bytes)).decode('ascii')
                comp = 1
            else:
                content_out = raw
                comp = 0
            
            entries.append(f"{rp}|{sha}|{len(raw_bytes)//4}|{comp}")
            blocks.append(f"---\n{content_out}\n===")
            pos = start_c + e_match.end()
        
        meta = [
            "@meta",
            f"project={state.project_name}",
            f"timestamp={datetime.datetime.now().isoformat()}",
            f"version={backup_stats.get('Backup Version', 'v1')}",
            f"files={len(files_list)}",
            f"size={backup_stats.get('Repo Size', 'N/A')}",
            f"generator=jugaad/{VERSION}",
            f"created_by={AUTHOR}",
            f"source_host={state.hostname}",
        ]
        
        output = meta + ["", "@files"]
        for e, b in zip(entries, blocks):
            output.extend([e, b])
        
        return "\n".join(output)
    
    return ""


def save_toon(state: GlobalState, toon_content: str, console=None) -> str:
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    toon_dir = os.path.join(state.project_root, JUGAAD_DIR_NAME, TOON_SUBDIR)
    os.makedirs(toon_dir, exist_ok=True)
    
    filename = f"JugaadBKP_{timestamp}.toon"
    filepath = os.path.join(toon_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(toon_content)
    
    return filepath


# =============================================================================
# TEXTUAL UI - MODAL SCREENS
# =============================================================================

class QuitModal(ModalScreen[bool]):
    BINDINGS = [Binding("y", "confirm"), Binding("n", "cancel"), Binding("escape", "cancel")]
    
    def compose(self) -> ComposeResult:
        yield Container(
            Label("Quit Jugaad?", classes="modal-title"),
            Label("Are you sure you want to exit?", classes="modal-msg"),
            Horizontal(
                Button("Yes [y]", variant="error", id="btn-yes"),
                Button("No [n]", variant="primary", id="btn-no"),
                classes="modal-btns",
            ),
            classes="modal-box",
        )
    
    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(event.button.id == "btn-yes")
    
    def action_confirm(self) -> None:
        self.dismiss(True)
    
    def action_cancel(self) -> None:
        self.dismiss(False)


class FlushModal(ModalScreen[bool]):
    BINDINGS = [Binding("y", "confirm"), Binding("n", "cancel"), Binding("escape", "cancel")]
    
    def compose(self) -> ComposeResult:
        yield Container(
            Label("Flush All Backups?", classes="modal-title"),
            Label("This will permanently delete ALL backup files.", classes="modal-msg"),
            Label("This action cannot be undone.", classes="modal-warn"),
            Horizontal(
                Button("Yes [y]", variant="error", id="btn-yes"),
                Button("No [n]", variant="primary", id="btn-no"),
                classes="modal-btns",
            ),
            classes="modal-box",
        )
    
    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(event.button.id == "btn-yes")
    
    def action_confirm(self) -> None:
        self.dismiss(True)
    
    def action_cancel(self) -> None:
        self.dismiss(False)


class PasswordModal(ModalScreen[str]):
    BINDINGS = [Binding("enter", "submit"), Binding("escape", "cancel")]
    
    def __init__(self, title: str = "Enter Password", msg: str = ""):
        super().__init__()
        self._title = title
        self._msg = msg
    
    def compose(self) -> ComposeResult:
        yield Container(
            Label(self._title, classes="modal-title"),
            Label(self._msg, classes="modal-msg"),
            Input(placeholder="Password (leave empty for none)", password=True, id="pwd-input"),
            Horizontal(
                Button("OK [Enter]", variant="primary", id="btn-ok"),
                Button("Cancel [Esc]", id="btn-cancel"),
                classes="modal-btns",
            ),
            classes="modal-box",
        )
    
    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-ok":
            self.dismiss(self.query_one(Input).value)
        else:
            self.dismiss("")
    
    def action_submit(self) -> None:
        self.dismiss(self.query_one(Input).value)
    
    def action_cancel(self) -> None:
        self.dismiss("")


class GitignoreModal(ModalScreen[str]):
    """Ask user about .gitignore respect."""
    BINDINGS = [Binding("1", "smart"), Binding("2", "full"), Binding("escape", "cancel")]
    
    def __init__(self, patterns: List[str]):
        super().__init__()
        self.patterns = patterns[:10]  # Show first 10
    
    def compose(self) -> ComposeResult:
        pattern_list = "\n".join(f"  • {p}" for p in self.patterns[:5])
        yield Container(
            Label("Backup Mode Selection", classes="modal-title"),
            Label(f".gitignore detected with {len(self.patterns)} patterns:", classes="modal-msg"),
            Static(pattern_list, classes="modal-patterns"),
            Label(""),
            Button("[1] Smart Backup - Respect .gitignore (Recommended)", id="btn-smart", variant="primary"),
            Button("[2] Full Backup - Include ALL files (Caution)", id="btn-full"),
            Button("[Esc] Cancel", id="btn-cancel"),
            classes="modal-box gitignore-modal",
        )
    
    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-smart":
            self.dismiss("smart")
        elif event.button.id == "btn-full":
            self.dismiss("full")
        else:
            self.dismiss("")
    
    def action_smart(self) -> None:
        self.dismiss("smart")
    
    def action_full(self) -> None:
        self.dismiss("full")
    
    def action_cancel(self) -> None:
        self.dismiss("")


class BackupSelectModal(ModalScreen[str]):
    BINDINGS = [Binding("escape", "cancel")]
    
    def __init__(self, backups: List[Dict], title: str = "Select Backup"):
        super().__init__()
        self.backups = backups
        self._title = title
    
    def compose(self) -> ComposeResult:
        items = [ListItem(Static("[ Cancel ]"))]
        for bk in self.backups[:15]:
            enc = "🔒" if bk.get("encrypted") else "📄"
            m = bk["modified"].strftime("%m-%d %H:%M")
            label = f"{enc} {bk['name'][:30]} | {bk['version']} | {human_size(bk['size'])} | {m}"
            items.append(ListItem(Static(label)))
        
        yield Container(
            Label(self._title, classes="modal-title"),
            ListView(*items, id="bk-list"),
            classes="modal-box select-modal",
        )
    
    def on_list_view_selected(self, event: ListView.Selected) -> None:
        idx = event.list_view.index
        if idx == 0 or idx > len(self.backups):
            self.dismiss("")
        else:
            self.dismiss(self.backups[idx - 1]["path"])
    
    def action_cancel(self) -> None:
        self.dismiss("")


class ModeSelectModal(ModalScreen[str]):
    BINDINGS = [Binding("escape", "cancel")]
    
    def compose(self) -> ComposeResult:
        yield Container(
            Label("Rehydration Mode", classes="modal-title"),
            ListView(
                ListItem(Static("[ Cancel ]")),
                ListItem(Static("📁 Folder Structure - Restore original directory tree")),
                ListItem(Static("📄 Single AIO File - All code in one .txt")),
            ),
            classes="modal-box select-modal",
        )
    
    def on_list_view_selected(self, event: ListView.Selected) -> None:
        modes = ["", "tree", "aio"]
        idx = event.list_view.index
        self.dismiss(modes[idx] if idx < len(modes) else "")
    
    def action_cancel(self) -> None:
        self.dismiss("")


class InfoModal(ModalScreen[bool]):
    """Display information to user."""
    BINDINGS = [Binding("enter", "ok"), Binding("escape", "ok")]
    
    def __init__(self, title: str, content: str):
        super().__init__()
        self._title = title
        self._content = content
    
    def compose(self) -> ComposeResult:
        yield Container(
            Label(self._title, classes="modal-title"),
            Static(self._content, classes="modal-content"),
            Button("OK [Enter]", variant="primary", id="btn-ok"),
            classes="modal-box info-modal",
        )
    
    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(True)
    
    def action_ok(self) -> None:
        self.dismiss(True)


# =============================================================================
# TEXTUAL UI - MAIN APP
# =============================================================================

class JugaadApp(App):
    """Jugaad Backup Dashboard - Enhanced UI with 70/30 split."""
    
    CSS = """
    /* App */
    App {
        background: $surface;
    }
    
    /* Header - ASCII Art */
    Header {
        background: $panel;
        color: $text;
        height: 8;
        padding: 0;
    }
    
    Header .header--title {
        text-align: center;
        color: $primary;
        text-style: bold;
        overflow: hidden;
    }
    
    /* ROOT Bar */
    .root-bar {
        background: $primary;
        color: $text;
        padding: 0 2;
        height: 1;
        text-style: bold;
    }
    
    /* Main Layout */
    .main-layout {
        layout: horizontal;
        height: 1fr;
    }
    
    /* Sidebar - 30% */
    .sidebar {
        width: 30%;
        min-width: 20;
        max-width: 35;
        background: $panel;
        border-right: solid $primary;
        layout: vertical;
    }
    
    .sidebar-title {
        text-align: center;
        color: $primary;
        text-style: bold;
        padding: 1;
        border-bottom: solid $primary;
    }
    
    .menu-item {
        padding: 1 2;
        margin: 0 1;
    }
    
    .menu-item:hover {
        background: $primary 20%;
    }
    
    .menu-key {
        color: $primary;
        text-style: bold;
    }
    
    .menu-danger {
        color: $error;
    }
    
    /* Content Area - 70% */
    .content-area {
        width: 70%;
        layout: vertical;
    }
    
    /* Info Panel - Top Half */
    .info-panel {
        height: 50%;
        border-bottom: solid $primary;
        layout: vertical;
    }
    
    .info-header {
        text-style: bold;
        color: $primary;
        padding: 1;
        background: $panel;
    }
    
    /* Prompt Panel - Bottom Half */
    .prompt-panel {
        height: 50%;
        layout: vertical;
        padding: 1;
    }
    
    .prompt-header {
        text-style: bold;
        color: $accent;
        padding: 1;
        border-bottom: solid $accent;
        margin-bottom: 1;
    }
    
    /* Footer */
    Footer {
        background: $panel;
        color: $text-muted;
    }
    
    .copyright-bar {
        background: $primary;
        color: $text;
        text-align: center;
        padding: 0;
        height: 1;
    }
    
    /* DataTable */
    DataTable {
        height: 1fr;
    }
    
    /* RichLog */
    RichLog {
        height: 1fr;
        background: $surface;
    }
    
    /* Modals */
    .modal-box {
        width: 55;
        height: auto;
        background: $surface;
        border: solid $primary;
        padding: 1;
    }
    
    .select-modal {
        height: 18;
    }
    
    .select-modal ListView {
        height: 1fr;
    }
    
    .info-modal {
        height: auto;
        max-height: 20;
    }
    
    .info-modal .modal-content {
        height: auto;
        max-height: 12;
        overflow: auto;
    }
    
    .gitignore-modal {
        height: auto;
    }
    
    .gitignore-modal Button {
        width: 100%;
        margin: 1 0;
    }
    
    .modal-title {
        text-style: bold;
        color: $primary;
        text-align: center;
        margin-bottom: 1;
    }
    
    .modal-msg {
        text-align: center;
        margin-bottom: 1;
    }
    
    .modal-warn {
        color: $warning;
        text-align: center;
        margin-bottom: 1;
    }
    
    .modal-patterns {
        color: $text-muted;
        margin-bottom: 1;
        padding: 1;
        background: $panel;
    }
    
    .modal-btns {
        align: center middle;
        height: auto;
        margin-top: 1;
    }
    
    .modal-btns Button {
        margin: 0 1;
        min-width: 12;
    }
    
    /* Input */
    Input {
        margin: 1 0;
    }
    """
    
    BINDINGS = [
        Binding("q", "quit_app", "Quit"),
        Binding("1", "backup_full", "Backup"),
        Binding("2", "backup_inc", "Incremental"),
        Binding("3", "rehydrate", "Rehydrate"),
        Binding("4", "toon_export", "TOON"),
        Binding("5", "view_backups", "View"),
        Binding("6", "search", "Search"),
        Binding("7", "stats", "Statistics"),
        Binding("8", "diff", "Diff"),
        Binding("9", "rotate", "Rotate"),
        Binding("0", "settings", "Settings"),
        Binding("f", "flush", "Flush"),
        Binding("e", "encrypt", "Encrypt"),
        Binding("v", "validate", "Validate"),
        Binding("escape", "refresh", "Refresh"),
    ]
    
    def __init__(self):
        super().__init__()
        self.state = GlobalState(
            project_root=detect_project_root(),
            project_name=os.path.basename(detect_project_root())
        )
        self.console = Console()
        self.last_action = "None"
    
    def compose(self) -> ComposeResult:
        yield Header(show_clock=False)
        yield Static(self._get_root_bar(), classes="root-bar")
        yield Horizontal(
            self._compose_sidebar(),
            self._compose_content(),
            classes="main-layout",
        )
        yield Static(f"© 2026 {AUTHOR} | All Rights Reserved | Jugaad Backup v{VERSION}", classes="copyright-bar")
    
    def _get_root_bar(self) -> str:
        return f" ROOT: {self.state.project_root}"
    
    def _compose_sidebar(self) -> Container:
        menu = [
            ("[1]", "Backup Full", ""),
            ("[2]", "Backup Incremental", ""),
            ("[3]", "Rehydrate", ""),
            ("[4]", "Export TOON", ""),
            ("[5]", "View Backups", ""),
            ("[6]", "Search", ""),
            ("[7]", "Statistics", ""),
            ("[8]", "Backup Diff", ""),
            ("[9]", "Rotate Old", ""),
            ("[0]", "Settings", ""),
            ("", "", ""),
            ("[F]", "Flush", ""),
            ("[E]", "Encrypt Backup", ""),
            ("[V]", "Validate", ""),
            ("[Q]", "Quit", "danger"),
        ]
        
        return Container(
            Static("━━━ COMMANDS ━━━", classes="sidebar-title"),
            *[
                Static(f"  {key} {desc}", classes=f"menu-item menu-{cls}" if cls else "menu-item")
                for key, desc, cls in menu
            ],
            classes="sidebar"
        )
    
    def _compose_content(self) -> Container:
        return Container(
            # Top: Info Panel
            Container(
                Static("━━━ STATUS ━━━", classes="info-header"),
                DataTable(id="info-table", zebra_stripes=True),
                classes="info-panel",
            ),
            # Bottom: Prompt/Log Panel
            Container(
                Static("━━━ OUTPUT ━━━", classes="prompt-header"),
                RichLog(id="log-output", wrap=True),
                classes="prompt-panel",
            ),
            classes="content-area"
        )
    
    def on_mount(self) -> None:
        self.title = ""
        self._refresh_info()
        self._log("Welcome to Jugaad Backup v" + VERSION)
        self._log("Created In Emergency By " + AUTHOR)
        self._log("")
        self._log("Press a number key to execute a command")
    
    def _refresh_info(self) -> None:
        table = self.query_one("#info-table", DataTable)
        table.clear(columns=True)
        
        table.add_column("Property", width=20)
        table.add_column("Value")
        
        backups = get_backups_list(self.state.project_root)
        
        table.add_row("Project", self.state.project_name)
        table.add_row("Host", self.state.hostname)
        table.add_row("Root", self.state.project_root[:45])
        table.add_row("─" * 20, "─" * 30)
        table.add_row("Total Backups", str(len(backups)))
        
        if backups:
            latest = backups[0]
            enc = "🔒 Yes" if latest.get("encrypted") else "📄 No"
            table.add_row("Latest", latest["name"][:35])
            table.add_row("Version", latest["version"])
            table.add_row("Files", str(latest["files"]))
            table.add_row("Size", human_size(latest["size"]))
            table.add_row("Modified", latest["modified"].strftime("%Y-%m-%d %H:%M"))
            table.add_row("Encrypted", enc)
            table.add_row("Total Size", human_size(sum(b["size"] for b in backups)))
        else:
            table.add_row("Latest", "No backups found")
            table.add_row("", "Press [1] to create backup")
    
    def _log(self, msg: str, style: str = None) -> None:
        try:
            log_widget = self.query_one("#log-output", RichLog)
            if style:
                log_widget.write(f"[{style}]{msg}[/{style}]")
            else:
                log_widget.write(msg)
        except:
            pass
    
    def _update_root_bar(self) -> None:
        try:
            bar = self.query_one(".root-bar", Static)
            bar.update(self._get_root_bar())
        except:
            pass
    
    # === ACTIONS ===
    
    def action_quit_app(self) -> None:
        def cb(result: bool) -> None:
            if result:
                self.exit()
        self.push_screen(QuitModal(), cb)
    
    def action_backup_full(self) -> None:
        # Check for .gitignore
        gitignore_patterns = get_gitignore_patterns(self.state.project_root)
        
        def do_backup(mode: str) -> None:
            if not mode:
                return
            
            self.state.respect_gitignore = (mode == "smart")
            
            def get_password(pwd: str) -> None:
                self.state.encryption_password = pwd
                self.state.encryption_enabled = bool(pwd)
                self._do_backup()
            
            self.push_screen(
                PasswordModal("Backup Password", "Enter password to encrypt (or leave empty for plain)"),
                get_password
            )
        
        if gitignore_patterns and has_sensitive_patterns(gitignore_patterns):
            self.push_screen(GitignoreModal(gitignore_patterns), do_backup)
        else:
            do_backup("smart")
    
    def action_backup_inc(self) -> None:
        self.state.respect_gitignore = True
        self._do_backup(incremental=True)
    
    def _do_backup(self, incremental: bool = False) -> None:
        self._log("")
        self._log("Starting backup...", "cyan")
        
        try:
            init_phase(self.state, self.console)
            scan_phase(self.state, self.console)
            
            if incremental:
                added, modified, unchanged = detect_changed_files(
                    self.state.project_root, self.state.file_details, self.console
                )
                
                if not added and not modified:
                    self._log("No changes detected since last backup", "yellow")
                    return
                
                self.state.file_details = added + modified
                self.state.total_included = len(self.state.file_details)
                self._log(f"Changes: +{len(added)} new, ~{len(modified)} modified", "cyan")
            
            build_backup(
                self.state, self.console,
                incremental=incremental,
                encrypt=self.state.encryption_enabled,
                password=self.state.encryption_password
            )
            
            enc_str = "(Encrypted)" if self.state.encryption_enabled else ""
            inc_str = "(Incremental)" if incremental else ""
            self._log(f"✓ Backup created {enc_str} {inc_str}", "green")
            self._log(f"  {os.path.basename(self.state.backup_file_path)}", "dim")
            
            self._refresh_info()
            
        except Exception as e:
            self._log(f"✗ Backup failed: {e}", "red")
    
    def action_rehydrate(self) -> None:
        backups = get_backups_list(self.state.project_root)
        
        if not backups:
            self._log("No backups to rehydrate", "yellow")
            return
        
        def select_backup(path: str) -> None:
            if not path:
                return
            
            is_enc = SecureEncryption.is_encrypted(path)
            
            def get_mode(mode: str) -> None:
                if not mode:
                    return
                
                def get_pwd(pwd: str) -> None:
                    if is_enc and not pwd:
                        self._log("Password required for encrypted backup", "red")
                        return
                    self._do_rehydrate(path, mode, pwd)
                
                if is_enc:
                    self.push_screen(PasswordModal("Decrypt Backup", "Enter password"), get_pwd)
                else:
                    get_pwd("")
            
            self.push_screen(ModeSelectModal(), get_mode)
        
        self.push_screen(BackupSelectModal(backups, "Select Backup to Rehydrate"), select_backup)
    
    def _do_rehydrate(self, path: str, mode: str, pwd: str = "") -> None:
        self._log("")
        self._log("Rehydrating backup...", "cyan")
        
        try:
            rehydrate(self.state, self.console, backup_path=path, mode=mode, password=pwd)
            self._log("✓ Rehydration complete", "green")
        except Exception as e:
            self._log(f"✗ Rehydration failed: {e}", "red")
    
    def action_toon_export(self) -> None:
        backups = get_backups_list(self.state.project_root)
        
        if not backups:
            self._log("No backups to export", "yellow")
            return
        
        def select_backup(path: str) -> None:
            if not path:
                return
            
            is_enc = SecureEncryption.is_encrypted(path)
            
            def get_pwd(pwd: str) -> None:
                if is_enc and not pwd:
                    self._log("Password required", "red")
                    return
                
                self._log("")
                self._log("Exporting TOON...", "cyan")
                
                try:
                    toon = export_toon(self.state, self.console, backup_path=path, password=pwd)
                    if toon:
                        filepath = save_toon(self.state, toon, self.console)
                        self._log(f"✓ TOON exported: {os.path.basename(filepath)}", "green")
                except Exception as e:
                    self._log(f"✗ Export failed: {e}", "red")
            
            if is_enc:
                self.push_screen(PasswordModal("Decrypt Backup", "Enter password"), get_pwd)
            else:
                get_pwd("")
        
        self.push_screen(BackupSelectModal(backups, "Select Backup for TOON"), select_backup)
    
    def action_view_backups(self) -> None:
        backups = get_backups_list(self.state.project_root)
        
        table = self.query_one("#info-table", DataTable)
        table.clear(columns=True)
        
        table.add_column("#", width=3)
        table.add_column("File", width=30)
        table.add_column("Ver", width=6)
        table.add_column("Files", width=5)
        table.add_column("Size", width=10)
        table.add_column("Date", width=14)
        table.add_column("Enc", width=3)
        
        for i, bk in enumerate(backups[:15]):
            enc = "🔒" if bk.get("encrypted") else "📄"
            table.add_row(
                str(i + 1),
                bk["name"][:30],
                bk["version"],
                str(bk["files"]),
                human_size(bk["size"]),
                bk["modified"].strftime("%m-%d %H:%M"),
                enc
            )
        
        self._log(f"Showing {min(len(backups), 15)} of {len(backups)} backups")
    
    def action_search(self) -> None:
        self._log("Use CLI: jugaad search <term>")
    
    def action_stats(self) -> None:
        self._log("")
        self._log("Calculating statistics...", "cyan")
        
        estimation = SizeEstimator.estimate_backup_size(self.state.project_root)
        
        table = self.query_one("#info-table", DataTable)
        table.clear(columns=True)
        
        table.add_column("Metric", width=25)
        table.add_column("Value")
        
        table.add_row("Total Files", str(estimation["total_files"]))
        table.add_row("Total Size", estimation["total_size_human"])
        table.add_row("Est. Compressed", estimation["estimated_compressed"])
        table.add_row("─" * 20, "─" * 20)
        
        for ext, size in list(estimation["by_extension"].items())[:10]:
            table.add_row(f"  {ext or '(none)'}", size)
        
        self._log("✓ Statistics calculated", "green")
    
    def action_diff(self) -> None:
        backups = get_backups_list(self.state.project_root)
        
        if len(backups) < 2:
            self._log("Need at least 2 backups to compare", "yellow")
            return
        
        def select_first(path1: str) -> None:
            if not path1:
                return
            
            remaining = [b for b in backups if b["path"] != path1]
            
            def select_second(path2: str) -> None:
                if not path2:
                    return
                
                self._log("")
                self._log("Comparing backups...", "cyan")
                
                result = BackupDiffer.compare_backups(path1, path2)
                
                table = self.query_one("#info-table", DataTable)
                table.clear(columns=True)
                table.add_column("Status", width=15)
                table.add_column("Count", width=10)
                table.add_column("Files", width=40)
                
                table.add_row("Added", str(result["stats"]["total_added"]), ", ".join(result["added"][:5])[:40])
                table.add_row("Removed", str(result["stats"]["total_removed"]), ", ".join(result["removed"][:5])[:40])
                table.add_row("Modified", str(result["stats"]["total_modified"]), ", ".join(result["modified"][:5])[:40])
                table.add_row("Unchanged", str(result["stats"]["total_unchanged"]), "")
                
                self._log("✓ Diff complete", "green")
            
            self.push_screen(BackupSelectModal(remaining, "Select Second Backup"), select_second)
        
        self.push_screen(BackupSelectModal(backups, "Select First Backup"), select_first)
    
    def action_rotate(self) -> None:
        self._log("")
        self._log("Rotating old backups...", "cyan")
        
        deleted = BackupRotator.rotate_backups(self.state.project_root, keep_days=30, keep_count=10, console=self.console)
        
        self._log(f"✓ Rotated {deleted} old backups", "green")
        self._refresh_info()
    
    def action_flush(self) -> None:
        def cb(result: bool) -> None:
            if result:
                jugaad_root = os.path.join(self.state.project_root, JUGAAD_DIR_NAME)
                if os.path.isdir(jugaad_root):
                    shutil.rmtree(jugaad_root)
                    self._log("✓ All backups deleted", "yellow")
                    self._refresh_info()
        
        self.push_screen(FlushModal(), cb)
    
    def action_encrypt(self) -> None:
        plain_backups = [b for b in get_backups_list(self.state.project_root) if not b.get("encrypted")]
        
        if not plain_backups:
            self._log("No plain backups to encrypt", "yellow")
            return
        
        def select_backup(path: str) -> None:
            if not path:
                return
            
            def get_pwd(pwd: str) -> None:
                if not pwd:
                    self._log("Password required", "red")
                    return
                
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    encrypted = SecureEncryption.encrypt_data(content, pwd)
                    
                    with open(path, 'wb') as f:
                        f.write(b'JUGAAD_ENCRYPTED_v2\n')
                        f.write(encrypted)
                    
                    self._log("✓ Backup encrypted", "green")
                    self._refresh_info()
                except Exception as e:
                    self._log(f"✗ Encryption failed: {e}", "red")
            
            self.push_screen(PasswordModal("Set Password", "Enter encryption password"), get_pwd)
        
        self.push_screen(BackupSelectModal(plain_backups, "Select Backup to Encrypt"), select_backup)
    
    def action_validate(self) -> None:
        backups = get_backups_list(self.state.project_root)
        
        if not backups:
            self._log("No backups to validate", "yellow")
            return
        
        def select_backup(path: str) -> None:
            if not path:
                return
            
            is_enc = SecureEncryption.is_encrypted(path)
            
            def get_pwd(pwd: str) -> None:
                self._log("")
                self._log("Validating backup...", "cyan")
                
                if is_enc:
                    if not pwd:
                        self._log("Password required", "red")
                        return
                    # Decrypt to temp, validate
                    try:
                        content = SecureEncryption.decrypt_data(open(path, 'rb').read()[20:], pwd)
                        valid, results = True, [{"status": "encrypted", "valid": True}]
                    except Exception as e:
                        valid, results = False, [{"error": str(e)}]
                else:
                    valid, results = IntegrityVerifier.verify_backup_integrity(path)
                
                table = self.query_one("#info-table", DataTable)
                table.clear(columns=True)
                table.add_column("File", width=40)
                table.add_column("Status", width=10)
                
                for r in results[:15]:
                    status = "✓" if r.get("valid", True) else "✗"
                    table.add_row(r.get("path", r.get("status", "?")), status)
                
                if valid:
                    self._log(f"✓ Backup is valid ({len(results)} files)", "green")
                else:
                    self._log("✗ Backup has integrity issues", "red")
            
            if is_enc:
                self.push_screen(PasswordModal("Decrypt to Validate", "Enter password"), get_pwd)
            else:
                get_pwd("")
        
        self.push_screen(BackupSelectModal(backups, "Select Backup to Validate"), select_backup)
    
    def action_settings(self) -> None:
        self._log("")
        self._log("Settings:")
        self._log("  • Edit .gitignore to control excluded files")
        self._log("  • Config stored in ~/.jugaad/")
        self._log("  • Backups stored in .JugaadBKP/")
    
    def action_refresh(self) -> None:
        self._refresh_info()
        self._log("View refreshed")


# =============================================================================
# CUSTOM HEADER WIDGET
# =============================================================================

def get_header_widget() -> Static:
    """Return header with ASCII art."""
    return Static(HEADER_ART, classes="header-widget")


# =============================================================================
# CLI ENTRY POINTS
# =============================================================================

def run_dashboard():
    """Run the Textual dashboard."""
    app = JugaadApp()
    app.run()


def cli_backup(encrypt: bool = False):
    """CLI backup."""
    c = Console()
    root = detect_project_root()
    state = GlobalState(project_root=root, project_name=os.path.basename(root))
    
    pwd = input("Password (leave empty for plain): ") if encrypt else ""
    
    init_phase(state, c)
    scan_phase(state, c)
    build_backup(state, c, encrypt=encrypt, password=pwd)
    
    c.print(f"\n[bold green]Backup:[/] {state.backup_file_path}")


def cli_incremental():
    """CLI incremental backup."""
    c = Console()
    root = detect_project_root()
    state = GlobalState(project_root=root, project_name=os.path.basename(root))
    
    init_phase(state, c)
    scan_phase(state, c)
    
    added, modified, unchanged = detect_changed_files(root, state.file_details, c)
    
    if not added and not modified:
        c.print("[yellow]No changes.[/yellow]")
        return
    
    state.file_details = added + modified
    state.total_included = len(state.file_details)
    
    build_backup(state, c, incremental=True)
    
    c.print(f"\n[bold green]Incremental:[/] {state.backup_file_path}")


def cli_rehydrate(password: str = ""):
    """CLI rehydrate."""
    c = Console()
    root = detect_project_root()
    state = GlobalState(project_root=root, project_name=os.path.basename(root))
    
    rehydrate(state, c, mode="tree", password=password)


def cli_toon(password: str = ""):
    """CLI TOON export."""
    c = Console()
    root = detect_project_root()
    state = GlobalState(project_root=root, project_name=os.path.basename(root))
    
    toon = export_toon(state, c, password=password)
    filepath = save_toon(state, toon, c)
    
    c.print(f"\n[bold green]TOON:[/] {filepath}")


def cli_search(term: str):
    """CLI search."""
    c = Console()
    root = detect_project_root()
    state = GlobalState(project_root=root, project_name=os.path.basename(root))
    
    backups = get_backups_list(root)
    
    if not backups:
        c.print("[yellow]No backups.[/yellow]")
        return
    
    c.print(f"\n[cyan]Searching '{term}' in {len(backups)} backups...[/cyan]\n")
    
    for bk in backups[:10]:
        if bk.get("encrypted"):
            continue
            
        try:
            with open(bk["path"], 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            matches = list(re.finditer(rf'.{{0,40}}{re.escape(term)}.{{0,40}}', content, re.IGNORECASE))
            
            if matches:
                c.print(f"[green]{bk['name']}:[/] {len(matches)} matches")
                for m in matches[:5]:
                    c.print(f"  → {m.group().strip()}")
        except:
            continue


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Jugaad Backup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("command", nargs="?", choices=["backup", "incremental", "rehydrate", "toon", "search"])
    parser.add_argument("args", nargs="*")
    parser.add_argument("--encrypt", "-e", action="store_true")
    parser.add_argument("--password", "-p", type=str, default="")
    
    args = parser.parse_args()
    
    if args.command == "backup":
        cli_backup(encrypt=args.encrypt)
    elif args.command == "incremental":
        cli_incremental()
    elif args.command == "rehydrate":
        cli_rehydrate(password=args.password)
    elif args.command == "toon":
        cli_toon(password=args.password)
    elif args.command == "search":
        if args.args:
            cli_search(args.args[0])
        else:
            print("Usage: jugaad search <term>")
    else:
        run_dashboard()
