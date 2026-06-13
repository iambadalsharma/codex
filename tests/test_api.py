from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.json()['status'] == 'ok'


def test_tender_search():
    res = client.get('/api/tenders?keywords=solar')
    assert res.status_code == 200
    data = res.json()
    assert any('Solar' in t['title'] for t in data)


def test_bid_flow_and_history():
    payload = {
        'tender_id': 'TEST-1',
        'title': 'Test Tender',
        'department': 'IT',
        'value': '100',
        'due_date': '2026-12-31',
        'stage': 'draft'
    }
    create_res = client.post('/api/bids', json=payload)
    assert create_res.status_code == 200
    bid_id = create_res.json()['id']

    update_res = client.patch(f'/api/bids/{bid_id}/stage', json={'stage': 'submitted', 'comment': 'docs uploaded'})
    assert update_res.status_code == 200
    assert update_res.json()['stage'] == 'submitted'

    history_res = client.get(f'/api/bids/{bid_id}/history')
    assert history_res.status_code == 200
    history = history_res.json()
    assert history[0]['stage'] == 'submitted'
    assert len(history) >= 2
