const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const csv = (filename, columns, rows) => {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const body = [columns.join(','), ...rows.map((row) => columns.map((col) => escape(row[col])).join(','))].join('\n');
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename=${filename}`,
    },
  });
};

const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const hashPassword = async (password) => {
  const bytes = new TextEncoder().encode(password || '');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const uid = () => `CUST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const now = () => new Date().toISOString();
const safeFolder = (value) => String(value || 'item').trim().replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^-|-$/g, '') || 'item';
const dueDays = (dateValue) => {
  if (!dateValue) return null;
  const end = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  return Math.ceil((end - today) / 86400000);
};

const customerById = async (db, customerId) =>
  db.prepare('SELECT * FROM customers WHERE id = ?').bind(customerId).first();

const customerOut = (row) => ({
  id: row.id,
  customer_uid: row.customer_uid,
  business_name: row.business_name,
  owner_name: row.owner_name,
  email: row.email,
  phone: row.phone,
  created_at: row.created_at,
});

const tenderOut = (row) => ({ ...row, due_days: dueDays(row.submission_end_date) });

const route = async (request, env) => {
  if (!env.DB) return json({ detail: 'Cloudflare D1 binding DB is not configured' }, 500);

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const method = request.method.toUpperCase();

  if (method === 'GET' && path === 'health') return json({ status: 'ok', app: 'TenderEase', storage: 'cloudflare-d1' });

  if (method === 'POST' && path === 'auth/signup') {
    const payload = await readJson(request);
    if (!payload.email || !payload.password || !payload.business_name || !payload.owner_name) {
      return json({ detail: 'Business name, owner name, email and password are required' }, 422);
    }
    const existing = await env.DB.prepare('SELECT id FROM customers WHERE email = ?').bind(payload.email).first();
    if (existing) return json({ detail: 'Email already registered' }, 409);

    const createdAt = now();
    const passwordHash = await hashPassword(payload.password);
    const result = await env.DB.prepare(
      `INSERT INTO customers (customer_uid, business_name, owner_name, email, phone, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(uid(), payload.business_name, payload.owner_name, payload.email, payload.phone || null, passwordHash, createdAt).run();
    const customer = await env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(customerOut(customer));
  }

  if (method === 'POST' && path === 'auth/login') {
    const payload = await readJson(request);
    const passwordHash = await hashPassword(payload.password);
    const customer = await env.DB.prepare('SELECT * FROM customers WHERE email = ? AND password_hash = ?')
      .bind(payload.email, passwordHash)
      .first();
    if (!customer) return json({ detail: 'Invalid email or password' }, 401);
    return json(customerOut(customer));
  }

  const dashboardMatch = path.match(/^customers\/(\d+)\/dashboard$/);
  if (method === 'GET' && dashboardMatch) {
    const customerId = Number(dashboardMatch[1]);
    const tenders = (await env.DB.prepare('SELECT * FROM tenders WHERE customer_id = ?').bind(customerId).all()).results || [];
    const orders = (await env.DB.prepare('SELECT * FROM orders WHERE customer_id = ?').bind(customerId).all()).results || [];
    const filed = tenders.filter((t) => String(t.applied || '').toLowerCase() === 'yes');
    const won = tenders.filter((t) => String(t.current_status || '').toLowerCase() === 'won');
    const pendingOrders = orders.filter((o) => !['closed', 'delivered'].includes(String(o.order_status || '').toLowerCase()));
    const dueValues = tenders.map((t) => dueDays(t.submission_end_date)).filter((d) => d !== null);
    const pipelineValue = tenders.reduce((sum, t) => sum + Number(t.tender_value || 0), 0);
    return json({
      live_tenders: tenders.filter((t) => ['live', 'working'].includes(String(t.current_status || '').toLowerCase())).length,
      upcoming_tenders: tenders.filter((t) => String(t.current_status || '').toLowerCase() === 'upcoming').length,
      total_filed_tenders: filed.length,
      missed_tenders: tenders.filter((t) => String(t.current_status || '').toLowerCase() === 'missed').length,
      working_tenders: tenders.filter((t) => String(t.current_status || '').toLowerCase() === 'working').length,
      orders: orders.length,
      nearest_due_days: dueValues.length ? Math.min(...dueValues) : null,
      pipeline_value: pipelineValue,
      average_tender_value: tenders.length ? pipelineValue / tenders.length : 0,
      win_rate: filed.length ? (won.length / filed.length) * 100 : 0,
      pending_order_value: pendingOrders.reduce((sum, o) => sum + Number(o.total_order_value || 0), 0),
      urgent_tenders: dueValues.filter((d) => d >= 0 && d <= 7).length,
    });
  }

  const tendersMatch = path.match(/^customers\/(\d+)\/tenders$/);
  if (tendersMatch) {
    const customerId = Number(tendersMatch[1]);
    const customer = await customerById(env.DB, customerId);
    if (!customer) return json({ detail: 'Customer not found' }, 404);

    if (method === 'GET') {
      const rows = (await env.DB.prepare('SELECT * FROM tenders WHERE customer_id = ? ORDER BY updated_at DESC').bind(customerId).all()).results || [];
      return json(rows.map(tenderOut));
    }

    if (method === 'POST') {
      const payload = await readJson(request);
      if (!payload.tender_number || !payload.tender_title) return json({ detail: 'Tender number and title are required' }, 422);
      const folderPath = `customer_data/${customer.customer_uid}/tenders/${safeFolder(payload.tender_number)}`;
      const timestamp = now();
      const result = await env.DB.prepare(
        `INSERT INTO tenders (customer_id, remarks, published_date, submission_end_date, pre_bid_date, pre_bid_location,
          to_be_applied, not_applying_reason, applied, tender_number, tender_title, consignee, organisation, location,
          emd_value, ra, tender_value, quoted_value, result, winning_value, tender_link, current_status, folder_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        customerId,
        payload.remarks || null,
        payload.published_date || null,
        payload.submission_end_date || null,
        payload.pre_bid_date || null,
        payload.pre_bid_location || null,
        payload.to_be_applied || 'Review',
        payload.not_applying_reason || null,
        payload.applied || 'No',
        payload.tender_number,
        payload.tender_title,
        payload.consignee || null,
        payload.organisation || null,
        payload.location || null,
        Number(payload.emd_value || 0),
        payload.ra || 'No',
        Number(payload.tender_value || 0),
        Number(payload.quoted_value || 0),
        payload.result || null,
        Number(payload.winning_value || 0),
        payload.tender_link || null,
        payload.current_status || 'Upcoming',
        folderPath,
        timestamp,
        timestamp
      ).run();
      const row = await env.DB.prepare('SELECT * FROM tenders WHERE id = ?').bind(result.meta.last_row_id).first();
      return json(tenderOut(row));
    }
  }

  const importPdfMatch = path.match(/^customers\/(\d+)\/tenders\/import-pdf$/);
  if (method === 'POST' && importPdfMatch) {
    const customerId = Number(importPdfMatch[1]);
    const customer = await customerById(env.DB, customerId);
    if (!customer) return json({ detail: 'Customer not found' }, 404);
    const form = await request.formData();
    const file = form.get('pdf');
    const filename = file?.name || `tender-${Date.now()}.pdf`;
    const tenderNumber = filename.replace(/\.pdf$/i, '');
    const folderPath = `customer_data/${customer.customer_uid}/tenders/${safeFolder(tenderNumber)}`;
    const timestamp = now();
    const result = await env.DB.prepare(
      `INSERT INTO tenders (customer_id, tender_number, tender_title, applied, to_be_applied, current_status, tender_link, folder_path, created_at, updated_at)
       VALUES (?, ?, ?, 'No', 'Review', 'Review', ?, ?, ?, ?)`
    ).bind(customerId, tenderNumber, `PDF Imported Tender - ${tenderNumber}`, filename, folderPath, timestamp, timestamp).run();
    const row = await env.DB.prepare('SELECT * FROM tenders WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(tenderOut(row));
  }

  const tendersExportMatch = path.match(/^customers\/(\d+)\/tenders\/export$/);
  if (method === 'GET' && tendersExportMatch) {
    const customerId = Number(tendersExportMatch[1]);
    const rows = ((await env.DB.prepare('SELECT * FROM tenders WHERE customer_id = ?').bind(customerId).all()).results || []).map(tenderOut);
    return csv('tender-dashboard.csv', ['id', 'remarks', 'published_date', 'submission_end_date', 'pre_bid_date', 'pre_bid_location', 'to_be_applied', 'not_applying_reason', 'applied', 'due_days', 'tender_number', 'tender_title', 'consignee', 'organisation', 'location', 'emd_value', 'ra', 'tender_value', 'quoted_value', 'result', 'winning_value', 'tender_link', 'current_status', 'folder_path'], rows);
  }

  const ordersMatch = path.match(/^customers\/(\d+)\/orders$/);
  if (ordersMatch) {
    const customerId = Number(ordersMatch[1]);
    const customer = await customerById(env.DB, customerId);
    if (!customer) return json({ detail: 'Customer not found' }, 404);

    if (method === 'GET') {
      const rows = (await env.DB.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY updated_at DESC').bind(customerId).all()).results || [];
      return json(rows);
    }

    if (method === 'POST') {
      const payload = await readJson(request);
      if (!payload.gem_tender_reference) return json({ detail: 'GeM tender reference is required' }, 422);
      const folderPath = `customer_data/${customer.customer_uid}/orders/${safeFolder(payload.gem_tender_reference)}`;
      const timestamp = now();
      const result = await env.DB.prepare(
        `INSERT INTO orders (customer_id, gem_tender_reference, tech_specs_reference, category, contract_no, contract_link,
          contract_date, organisation, location, work, total_order_value, order_status, bg_value, bg_number, bg_link,
          bg_issue_date, bg_timeline, bg_status, collected_or_not, couriered, crac_link, folder_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        customerId,
        payload.gem_tender_reference,
        payload.tech_specs_reference || null,
        payload.category || null,
        payload.contract_no || null,
        payload.contract_link || null,
        payload.contract_date || null,
        payload.organisation || null,
        payload.location || null,
        payload.work || null,
        Number(payload.total_order_value || 0),
        payload.order_status || 'Generated',
        Number(payload.bg_value || 0),
        payload.bg_number || null,
        payload.bg_link || null,
        payload.bg_issue_date || null,
        payload.bg_timeline || null,
        payload.bg_status || null,
        payload.collected_or_not || 'No',
        payload.couriered || 'No',
        payload.crac_link || null,
        folderPath,
        timestamp,
        timestamp
      ).run();
      const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(result.meta.last_row_id).first();
      return json(row);
    }
  }

  const ordersExportMatch = path.match(/^customers\/(\d+)\/orders\/export$/);
  if (method === 'GET' && ordersExportMatch) {
    const customerId = Number(ordersExportMatch[1]);
    const rows = (await env.DB.prepare('SELECT * FROM orders WHERE customer_id = ?').bind(customerId).all()).results || [];
    return csv('orders-dashboard.csv', ['id', 'gem_tender_reference', 'tech_specs_reference', 'category', 'contract_no', 'contract_link', 'contract_date', 'organisation', 'location', 'work', 'total_order_value', 'order_status', 'bg_value', 'bg_number', 'bg_link', 'bg_issue_date', 'bg_timeline', 'bg_status', 'collected_or_not', 'couriered', 'crac_link', 'folder_path'], rows);
  }

  return json({ detail: 'Not found' }, 404);
};

export const onRequest = ({ request, env }) => route(request, env);
