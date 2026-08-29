from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def test_render_returns_png_bytes():
    response = client.post(
        "/render",
        json={
            "chart_type": "line",
            "x": [1, 2, 3],
            "y": [1, 4, 9],
            "title": "Test Chart",
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content.startswith(PNG_SIGNATURE)
    assert len(response.content) > 100
