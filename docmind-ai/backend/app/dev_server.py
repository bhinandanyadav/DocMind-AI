"""Start the development server without conflicting with an existing instance."""

from __future__ import annotations

import socket
import subprocess
import sys
from urllib.request import urlopen

HOST = "127.0.0.1"
PORT = 8001


def backend_is_healthy() -> bool:
    try:
        with urlopen(f"http://{HOST}:{PORT}/", timeout=2) as response:
            return response.status == 200
    except OSError:
        return False


def port_is_bound() -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        return probe.connect_ex((HOST, PORT)) == 0


def main() -> int:
    if backend_is_healthy():
        print(f"DocMind backend is already running at http://{HOST}:{PORT}")
        return 0

    if port_is_bound():
        print(
            f"Port {PORT} is already in use by another process. "
            "Stop that process or configure a different backend port."
        )
        return 1

    return subprocess.call([
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--host",
        HOST,
        "--port",
        str(PORT),
    ])


if __name__ == "__main__":
    raise SystemExit(main())
