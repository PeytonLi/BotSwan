from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
CHARTS_DIR = Path(__file__).resolve().parents[3] / "examples" / "charts"


def test_rasterize_svg_returns_png_base64():
    svg_bytes = (CHARTS_DIR / "truncated-axis.svg").read_bytes()
    response = client.post(
        "/rasterize-svg",
        content=svg_bytes,
        headers={"Content-Type": "image/svg+xml"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "png_base64" in data
    assert len(data["png_base64"]) > 100
