"""Extract figures and page images from PDF documents."""

from __future__ import annotations

import io
from typing import Any

import fitz


def extract_pdf_pages(pdf_bytes: bytes, dpi: int = 150) -> list[dict[str, Any]]:
    """Render each PDF page to a PNG image."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: list[dict[str, Any]] = []

    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    for index, page in enumerate(doc):
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        pages.append(
            {
                "page": index + 1,
                "width": pixmap.width,
                "height": pixmap.height,
                "png_bytes": pixmap.tobytes("png"),
            }
        )

    doc.close()
    return pages


def extract_pdf_figures(pdf_bytes: bytes) -> list[dict[str, Any]]:
    """Extract embedded images from a PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    figures: list[dict[str, Any]] = []

    for page_index, page in enumerate(doc):
        for image_index, image in enumerate(page.get_images(full=True)):
            xref = image[0]
            base_image = doc.extract_image(xref)
            figures.append(
                {
                    "page": page_index + 1,
                    "index": image_index,
                    "ext": base_image["ext"],
                    "bytes": base_image["image"],
                }
            )

    doc.close()
    return figures
