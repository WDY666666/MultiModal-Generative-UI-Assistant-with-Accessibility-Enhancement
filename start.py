"""
One-command dev launcher for the Multimodal Generative UI Assistant.
Starts the FastAPI backend and Vite frontend together.
"""

from __future__ import annotations

import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BACKEND_DIR = PROJECT_ROOT / "backend"
VENV_PYTHON = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"
DEFAULT_BACKEND_PORT = os.environ.get("BACKEND_PORT", "8000")

processes: list[subprocess.Popen] = []


def kill_process_tree(pid: int):
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except Exception:
            try:
                os.kill(pid, signal.SIGTERM)
            except Exception:
                pass


def free_port(port: str):
    if os.name != "nt":
        return

    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False,
        )
    except Exception:
        return

    current_pid = os.getpid()
    pids: set[int] = set()
    marker = f":{port}"
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) < 5 or parts[0] != "TCP":
            continue
        local_address, state, pid_text = parts[1], parts[3], parts[-1]
        if marker in local_address and state == "LISTENING" and pid_text.isdigit():
            pid = int(pid_text)
            if pid != 0 and pid != current_pid:
                pids.add(pid)

    for pid in pids:
        kill_process_tree(pid)


def is_port_open(port: str) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", int(port)), timeout=0.5):
            return True
    except OSError:
        return False


def choose_backend_port(preferred_port: str) -> str:
    free_port(preferred_port)
    if not is_port_open(preferred_port):
        return preferred_port

    print(f"Warning: backend port {preferred_port} is still occupied; trying the next available port.")
    start = int(preferred_port)
    for port in range(start + 1, start + 20):
        candidate = str(port)
        free_port(candidate)
        if not is_port_open(candidate):
            print(f"Using backend port {candidate} instead.")
            return candidate

    raise RuntimeError("Could not find a free backend port near the requested port.")


def find_python() -> str:
    if VENV_PYTHON.exists():
        try:
            subprocess.run(
                [str(VENV_PYTHON), "-c", "import encodings, uvicorn, pydantic_settings"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
            )
            return str(VENV_PYTHON)
        except Exception:
            print("Warning: .venv Python is not usable or misses backend dependencies; falling back to the current Python interpreter.")
    return sys.executable


def find_npm() -> str:
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    resolved = shutil.which(npm_cmd)
    if not resolved:
        raise RuntimeError("npm was not found. Please install Node.js and run npm install in frontend/.")
    return resolved


def cleanup(signum=None, frame=None):
    print("\nStopping dev servers...")
    for process in processes:
        if process.poll() is None:
            kill_process_tree(process.pid)
    for process in processes:
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            kill_process_tree(process.pid)
    print("All dev servers stopped.")
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print("=" * 56)
    print("  Multimodal Generative UI Assistant - starting...")
    print("=" * 56)

    python_exe = find_python()
    npm_exe = find_npm()

    print("\n[1/2] Starting backend (FastAPI) ...")
    backend_port = choose_backend_port(DEFAULT_BACKEND_PORT)
    free_port("5173")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", backend_port],
        cwd=BACKEND_DIR,
    )
    processes.append(backend_proc)

    print("[2/2] Starting frontend (Vite) ...")
    frontend_env = os.environ.copy()
    frontend_env["VITE_BACKEND_URL"] = f"http://localhost:{backend_port}"
    frontend_proc = subprocess.Popen(
        [npm_exe, "run", "dev"],
        cwd=FRONTEND_DIR,
        env=frontend_env,
    )
    processes.append(frontend_proc)

    time.sleep(3)
    print("\n" + "=" * 56)
    print("  Services started")
    print("  Frontend: http://localhost:5173")
    print(f"  Backend:  http://localhost:{backend_port}")
    print(f"  API docs: http://localhost:{backend_port}/docs")
    print("  Press Ctrl+C to stop all services")
    print("=" * 56 + "\n")

    try:
        while True:
            for process in processes:
                if process.poll() is not None:
                    print(f"A dev server exited unexpectedly (code={process.returncode}).")
                    cleanup()
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
