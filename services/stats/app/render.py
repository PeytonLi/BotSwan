"""Matplotlib chart rendering to PNG bytes."""

from __future__ import annotations

import io
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def render_chart(spec: dict[str, Any]) -> bytes:
    """Render a chart specification to PNG bytes."""
    chart_type = spec.get("chart_type", "line")
    x = spec.get("x", [])
    y = spec.get("y", [])
    title = spec.get("title", "")

    fig, ax = plt.subplots(figsize=(6, 4))

    if chart_type == "line":
        ax.plot(x, y)
    elif chart_type == "bar":
        ax.bar(x, y)
    elif chart_type == "scatter":
        ax.scatter(x, y)
    else:
        ax.plot(x, y)

    if title:
        ax.set_title(title)

    ax.grid(True, alpha=0.3)

    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight")
    plt.close(fig)
    buffer.seek(0)
    return buffer.read()
