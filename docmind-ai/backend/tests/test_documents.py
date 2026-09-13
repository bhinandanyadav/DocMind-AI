import io


def test_list_documents_empty(client, auth_headers):
    response = client.get("/documents", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_upload_document(client, auth_headers):
    file_content = b"Test document content for upload test"
    response = client.post(
        "/documents/upload",
        headers=auth_headers,
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["filename"] == "test.txt"
    assert "id" in data


def test_list_documents_after_upload(client, auth_headers):
    client.post(
        "/documents/upload",
        headers=auth_headers,
        files={"file": ("doc.txt", io.BytesIO(b"content"), "text/plain")},
    )
    response = client.get("/documents", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["items"]) == 1


def test_get_document(client, auth_headers):
    upload = client.post(
        "/documents/upload",
        headers=auth_headers,
        files={"file": ("detail.txt", io.BytesIO(b"content"), "text/plain")},
    )
    doc_id = upload.json()["id"]
    response = client.get(f"/documents/{doc_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["filename"] == "detail.txt"


def test_get_nonexistent_document(client, auth_headers):
    response = client.get("/documents/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert response.status_code == 404


def test_delete_document(client, auth_headers):
    upload = client.post(
        "/documents/upload",
        headers=auth_headers,
        files={"file": ("delete.txt", io.BytesIO(b"content"), "text/plain")},
    )
    doc_id = upload.json()["id"]
    response = client.delete(f"/documents/{doc_id}", headers=auth_headers)
    assert response.status_code == 204
    response = client.get(f"/documents/{doc_id}", headers=auth_headers)
    assert response.status_code == 404


def test_unauthorized_access(client):
    response = client.get("/documents")
    assert response.status_code in [401, 403]
