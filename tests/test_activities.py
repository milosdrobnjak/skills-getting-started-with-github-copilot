from src import app as app_module


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_seeded_data(client):
    response = client.get("/activities")

    assert response.status_code == 200

    payload = response.json()

    assert "Chess Club" in payload
    assert payload["Chess Club"]["description"] == app_module.activities["Chess Club"]["description"]
    assert payload["Chess Club"]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_get_activities_exposes_all_seeded_activities(client):
    response = client.get("/activities")

    assert response.status_code == 200
    assert set(response.json().keys()) == set(app_module.activities.keys())