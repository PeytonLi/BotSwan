"""URL screenshot capture (Playwright optional)."""

from __future__ import annotations


class ScreenshotError(Exception):
    """Raised when screenshot capture fails."""


def screenshot_url(url: str, width: int = 1280, height: int = 720) -> bytes:
    """Capture a PNG screenshot of a URL using Playwright when available."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise ScreenshotError(
            "Playwright is not installed. Install with: pip install 'botswan-stats[browser]' "
            "&& playwright install chromium"
        ) from exc

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(url, wait_until="networkidle")
        png_bytes = page.screenshot(type="png", full_page=True)
        browser.close()
        return png_bytes


def screenshot_url_stub(url: str, width: int = 1280, height: int = 720) -> bytes:
    """Return a minimal PNG placeholder when browser automation is unavailable."""
    import io

    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(width / 100, height / 100))
    ax.text(0.5, 0.5, f"Screenshot stub\n{url}", ha="center", va="center", fontsize=10)
    ax.axis("off")

    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight")
    plt.close(fig)
    buffer.seek(0)
    return buffer.read()
