"""Rasterize SVG charts to PNG for vision models."""

from __future__ import annotations

import fitz


def rasterize_svg(svg_bytes: bytes, width: int = 960) -> bytes:
    """Convert SVG bytes to PNG using PyMuPDF."""
    if not svg_bytes.strip():
        raise ValueError("Empty SVG payload")

    doc = fitz.open(stream=svg_bytes, filetype="svg")
    try:
        page = doc[0]
        if page.rect.width <= 0:
            raise ValueError("Invalid SVG dimensions")

        zoom = width / page.rect.width
        matrix = fitz.Matrix(zoom, zoom)
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        return pixmap.tobytes("png")
    finally:
        doc.close()
