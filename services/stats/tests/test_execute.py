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


def test_execute_allows_any_builtin():
    response = client.post(
        "/execute",
        json={"code": "print(any(x > 0 for x in [-1, 2, 3]))"},
    )
    assert response.status_code == 200
    assert response.json()["stdout"].strip() == "True"


def test_execute_sets_main_name():
    response = client.post(
        "/execute",
        json={"code": "print(__name__)"},
    )
    assert response.status_code == 200
    assert response.json()["stdout"].strip() == "__main__"
