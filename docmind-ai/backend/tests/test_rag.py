def test_chat_requires_auth(client):
    response = client.post("/chat/", json={"message": "hello"})
    assert response.status_code in [401, 403]


def test_chat_empty_message(client, auth_headers):
    response = client.post("/chat", json={"question": "", "document_ids": []}, headers=auth_headers)
    assert response.status_code == 422


def test_chat_no_documents(client, auth_headers):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.post(
        "/chat",
        json={"question": "What is in my documents?", "document_ids": [fake_id]},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_search_requires_auth(client):
    response = client.post("/search", json={"query": "test"})
    assert response.status_code in [401, 403]


def test_search_empty_query(client, auth_headers):
    response = client.post("/search", json={"query": ""}, headers=auth_headers)
    assert response.status_code in [400, 422]


def test_search_no_results(client, auth_headers):
    response = client.post("/search", json={"query": "nonexistent"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["results"] == []
