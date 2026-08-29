from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_execute_prints_result():
    response = client.post("/execute", json={"code": "print(2+2)"})
    assert response.status_code == 200
    data = response.json()
    assert data["stdout"].strip() == "4"
    assert data["error"] is None


def test_execute_blocks_import_os():
    response = client.post("/execute", json={"code": "import os\nprint(os.getcwd())"})
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "os" in data["detail"].lower() or "not allowed" in data["detail"].lower()
