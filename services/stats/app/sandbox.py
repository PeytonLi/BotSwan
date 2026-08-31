"""Restricted Python code execution with allowlist and timeout."""

from __future__ import annotations

import io
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Any

ALLOWED_MODULES: frozenset[str] = frozenset(
    {
        "math",
        "statistics",
        "json",
        "decimal",
        "fractions",
        "itertools",
        "functools",
        "collections",
        "re",
        "datetime",
        "numpy",
        "pandas",
        "scipy",
        "statsmodels",
    }
)

BLOCKED_MODULES: frozenset[str] = frozenset(
    {
        "os",
        "sys",
        "subprocess",
        "shutil",
        "pathlib",
        "socket",
        "http",
        "urllib",
        "importlib",
        "builtins",
        "ctypes",
        "multiprocessing",
        "pickle",
        "code",
        "pty",
        "signal",
        "tempfile",
        "glob",
        "io",
    }
)

SAFE_BUILTINS: dict[str, Any] = {
    "print": print,
    "range": range,
    "len": len,
    "min": min,
    "max": max,
    "sum": sum,
    "abs": abs,
    "round": round,
    "sorted": sorted,
    "enumerate": enumerate,
    "zip": zip,
    "map": map,
    "filter": filter,
    "any": any,
    "all": all,
    "pow": pow,
    "isinstance": isinstance,
    "list": list,
    "dict": dict,
    "set": set,
    "tuple": tuple,
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "True": True,
    "False": False,
    "None": None,
    "Exception": Exception,
    "ValueError": ValueError,
    "TypeError": TypeError,
    "KeyError": KeyError,
    "IndexError": IndexError,
}


class SandboxError(Exception):
    """Raised when sandboxed execution fails."""


class ImportBlockedError(SandboxError):
    """Raised when code attempts a disallowed import."""


def _safe_import(name: str, globals_: dict | None = None, locals_: dict | None = None, fromlist: tuple = (), level: int = 0):
    root = name.split(".", 1)[0]
    if root in BLOCKED_MODULES:
        raise ImportBlockedError(f"Import of '{name}' is not allowed")
    if root not in ALLOWED_MODULES:
        raise ImportBlockedError(f"Import of '{name}' is not allowed")
    return __import__(name, globals_, locals_, fromlist, level)


def _run_code(code: str, stdout: io.StringIO) -> None:
    namespace: dict[str, Any] = {"__builtins__": {**SAFE_BUILTINS, "__import__": _safe_import}}

    def captured_print(*args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("file", stdout)
        print(*args, **kwargs)

    namespace["__builtins__"]["print"] = captured_print
    exec(code, namespace, namespace)


def execute(code: str, timeout_seconds: float = 5.0) -> dict[str, str | None]:
    """Execute Python code in a restricted environment."""
    stdout = io.StringIO()
    error: str | None = None

    def target() -> None:
        nonlocal error
        try:
            _run_code(code, stdout)
        except ImportBlockedError as exc:
            error = str(exc)
        except Exception as exc:  # noqa: BLE001 — sandbox must surface user code errors
            error = str(exc)

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    thread.join(timeout=timeout_seconds)

    if thread.is_alive():
        raise SandboxError(f"Execution timed out after {timeout_seconds} seconds")

    if error and "not allowed" in error.lower():
        raise ImportBlockedError(error)

    if error:
        raise SandboxError(error)

    return {"stdout": stdout.getvalue(), "error": None}


def execute_with_pool(code: str, timeout_seconds: float = 5.0) -> dict[str, str | None]:
    """Execute using ThreadPoolExecutor (alternative timeout path)."""
    stdout_holder: dict[str, str] = {"value": ""}
    error_holder: dict[str, str | None] = {"value": None}

    def target() -> None:
        stdout = io.StringIO()
        try:
            _run_code(code, stdout)
            stdout_holder["value"] = stdout.getvalue()
        except ImportBlockedError as exc:
            error_holder["value"] = str(exc)
        except Exception as exc:  # noqa: BLE001
            error_holder["value"] = str(exc)

    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(target)
        try:
            future.result(timeout=timeout_seconds)
        except FuturesTimeoutError as exc:
            raise SandboxError(f"Execution timed out after {timeout_seconds} seconds") from exc

    error = error_holder["value"]
    if error and "not allowed" in error.lower():
        raise ImportBlockedError(error)
    if error:
        raise SandboxError(error)

    return {"stdout": stdout_holder["value"], "error": None}
