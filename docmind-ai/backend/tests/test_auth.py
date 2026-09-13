def test_register(client):
    response = client.post("/auth/register", json={
        "name": "New User",
        "email": "new@example.com",
        "password": "Secure123!"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "id" in data


def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "name": "User",
        "email": "dup@example.com",
        "password": "Pass1234!"
    })
    response = client.post("/auth/register", json={
        "name": "User 2",
        "email": "dup@example.com",
        "password": "Pass1234!"
    })
    assert response.status_code == 400


def test_login(client):
    client.post("/auth/register", json={
        "name": "Login User",
        "email": "login@example.com",
        "password": "Login1234!"
    })
    response = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "Login1234!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "name": "User",
        "email": "wrong@example.com",
        "password": "Correct123!"
    })
    response = client.post("/auth/login", json={
        "email": "wrong@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401


def test_me_endpoint(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


def test_me_unauthorized(client):
    response = client.get("/auth/me")
    assert response.status_code in [401, 403]
