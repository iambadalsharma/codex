CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_uid TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  serial_no INTEGER,
  remarks TEXT,
  published_date TEXT,
  submission_end_date TEXT,
  pre_bid_date TEXT,
  pre_bid_location TEXT,
  to_be_applied TEXT DEFAULT 'Review',
  not_applying_reason TEXT,
  applied TEXT DEFAULT 'No',
  tender_number TEXT NOT NULL,
  tender_title TEXT NOT NULL,
  consignee TEXT,
  organisation TEXT,
  location TEXT,
  emd_value REAL DEFAULT 0,
  ra TEXT DEFAULT 'No',
  tender_value REAL DEFAULT 0,
  quoted_value REAL DEFAULT 0,
  result TEXT,
  winning_value REAL DEFAULT 0,
  tender_link TEXT,
  current_status TEXT DEFAULT 'Upcoming',
  folder_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  serial_no INTEGER,
  gem_tender_reference TEXT NOT NULL,
  tech_specs_reference TEXT,
  category TEXT,
  contract_no TEXT,
  contract_link TEXT,
  contract_date TEXT,
  organisation TEXT,
  location TEXT,
  work TEXT,
  total_order_value REAL DEFAULT 0,
  order_status TEXT DEFAULT 'Generated',
  bg_value REAL DEFAULT 0,
  bg_number TEXT,
  bg_link TEXT,
  bg_issue_date TEXT,
  bg_timeline TEXT,
  bg_status TEXT,
  collected_or_not TEXT DEFAULT 'No',
  couriered TEXT DEFAULT 'No',
  crac_link TEXT,
  folder_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenders_customer_id ON tenders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
