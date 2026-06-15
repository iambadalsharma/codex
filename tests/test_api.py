from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def signup_customer():
    payload = {
        'business_name': 'Demo Traders',
        'owner_name': 'Amit Owner',
        'email': 'demo@example.com',
        'phone': '9999999999',
        'password': 'secret',
    }
    res = client.post('/api/auth/signup', json=payload)
    assert res.status_code in (200, 409)
    if res.status_code == 409:
        res = client.post('/api/auth/login', json={'email': payload['email'], 'password': payload['password']})
    assert res.status_code == 200
    return res.json()


def test_health():
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.json()['status'] == 'ok'


def test_customer_tender_order_dashboard_flow():
    customer = signup_customer()

    tender_payload = {
        'tender_number': 'GEM-2026-001',
        'tender_title': 'Office Equipment Supply',
        'submission_end_date': '2026-12-31',
        'organisation': 'Demo Department',
        'location': 'Delhi',
        'tender_value': 500000,
        'applied': 'Yes',
        'current_status': 'Working',
    }
    tender_res = client.post(f"/api/customers/{customer['id']}/tenders", json=tender_payload)
    assert tender_res.status_code == 200
    tender = tender_res.json()
    assert tender['folder_path']
    assert tender['due_days'] is not None

    order_payload = {
        'gem_tender_reference': 'GEM-2026-001',
        'category': 'Supply',
        'contract_no': 'CON-001',
        'organisation': 'Demo Department',
        'work': 'Supply and installation',
        'total_order_value': 450000,
        'order_status': 'Generated',
    }
    order_res = client.post(f"/api/customers/{customer['id']}/orders", json=order_payload)
    assert order_res.status_code == 200
    assert order_res.json()['folder_path']

    dashboard_res = client.get(f"/api/customers/{customer['id']}/dashboard")
    assert dashboard_res.status_code == 200
    dashboard = dashboard_res.json()
    assert dashboard['working_tenders'] >= 1
    assert dashboard['total_filed_tenders'] >= 1
    assert dashboard['orders'] >= 1
    assert dashboard['pipeline_value'] >= 500000
    assert dashboard['average_tender_value'] >= 500000
    assert 'win_rate' in dashboard
    assert dashboard['pending_order_value'] >= 450000

    export_res = client.get(f"/api/customers/{customer['id']}/tenders/export")
    assert export_res.status_code == 200
    assert 'tender-dashboard.csv' in export_res.headers['content-disposition']
