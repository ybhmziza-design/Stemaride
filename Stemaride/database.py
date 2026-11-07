import sqlite3
import os
import json
import random
import string
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'registrations.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_code TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            email TEXT,
            category TEXT NOT NULL,
            category_label TEXT NOT NULL,
            amount_due INTEGER NOT NULL,
            needs_hire INTEGER DEFAULT 0,
            hire_details TEXT,
            group_members TEXT,
            category_details TEXT,
            is_minor INTEGER DEFAULT 0,
            parent_name TEXT,
            parent_phone TEXT,
            consent_photography INTEGER DEFAULT 1,
            consent_rules INTEGER DEFAULT 1,
            emergency_contact TEXT,
            mpesa_reference TEXT,
            payment_status TEXT DEFAULT 'Pending Payment',
            checked_in INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    
    # Ensure columns exist if table was already created
    try:
        cursor.execute("PRAGMA table_info(registrations)")
        cols = [c[1] for c in cursor.fetchall()]
        if 'intasend_reference' not in cols:
            cursor.execute("ALTER TABLE registrations ADD COLUMN intasend_reference TEXT")
        if 'tinypesa_reference' not in cols:
            cursor.execute("ALTER TABLE registrations ADD COLUMN tinypesa_reference TEXT")
        if 'paystack_reference' not in cols:
            cursor.execute("ALTER TABLE registrations ADD COLUMN paystack_reference TEXT")
        if 'payment_attempts' not in cols:
            cursor.execute("ALTER TABLE registrations ADD COLUMN payment_attempts INTEGER DEFAULT 0")
        if 'payment_blocked' not in cols:
            cursor.execute("ALTER TABLE registrations ADD COLUMN payment_blocked INTEGER DEFAULT 0")
        conn.commit()
    except Exception:
        pass
        
    conn.close()

def generate_ticket_code():
    # Example format: STM-A8K25
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=5))
    return f"STM-{suffix}"

def create_registration(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate unique ticket code
    ticket_code = generate_ticket_code()
    # Ensure uniqueness
    while cursor.execute("SELECT id FROM registrations WHERE ticket_code = ?", (ticket_code,)).fetchone():
        ticket_code = generate_ticket_code()
        
    cursor.execute('''
        INSERT INTO registrations (
            ticket_code, full_name, phone_number, email, category,
            category_label, amount_due, needs_hire, hire_details,
            group_members, category_details, is_minor, parent_name,
            parent_phone, consent_photography, consent_rules,
            emergency_contact, mpesa_reference, payment_status, checked_in
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        ticket_code,
        data.get('full_name', '').strip(),
        data.get('phone_number', '').strip(),
        data.get('email', '').strip(),
        data.get('category', '').strip(),
        data.get('category_label', '').strip(),
        int(data.get('amount_due', 0)),
        1 if data.get('needs_hire') else 0,
        json.dumps(data.get('hire_details', {})),
        json.dumps(data.get('group_members', [])),
        json.dumps(data.get('category_details', {})),
        1 if data.get('is_minor') else 0,
        data.get('parent_name', '').strip(),
        data.get('parent_phone', '').strip(),
        1 if data.get('consent_photography') else 0,
        1 if data.get('consent_rules') else 0,
        data.get('emergency_contact', '').strip(),
        data.get('mpesa_reference', '').strip().upper(),
        'Pending Payment',
        0
    ))
    conn.commit()
    reg_id = cursor.lastrowid
    
    # Fetch created registration
    cursor.execute("SELECT * FROM registrations WHERE id = ?", (reg_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

def search_registration(query):
    conn = get_db_connection()
    cursor = conn.cursor()
    clean_query = query.strip()
    # Normalize phone: if starts with +254, check alternative or if starts with 0
    phone_alt = clean_query
    if clean_query.startswith('+254'):
        phone_alt = '0' + clean_query[4:]
    elif clean_query.startswith('254'):
        phone_alt = '0' + clean_query[3:]
    elif clean_query.startswith('0') and len(clean_query) == 10:
        phone_alt = '+254' + clean_query[1:]
        
    cursor.execute('''
        SELECT * FROM registrations 
        WHERE (payment_status LIKE '%Paid%' OR payment_status = 'Confirmed')
          AND (ticket_code = ? 
               OR UPPER(ticket_code) = UPPER(?)
               OR phone_number LIKE ? 
               OR phone_number LIKE ?
               OR UPPER(tinypesa_reference) = UPPER(?)
               OR UPPER(intasend_reference) = UPPER(?)
               OR UPPER(paystack_reference) = UPPER(?)
               OR UPPER(mpesa_reference) = UPPER(?))
        ORDER BY id DESC
    ''', (clean_query, clean_query, f"%{clean_query}%", f"%{phone_alt}%", clean_query, clean_query, clean_query, clean_query))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_registration_by_code(ticket_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_registrations(category_filter=None, search_term=None, paid_only=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM registrations WHERE 1=1"
    params = []
    
    if paid_only:
        query += " AND (payment_status LIKE '%Paid%' OR payment_status = 'Confirmed')"

    if category_filter and category_filter != 'all':
        query += " AND category = ?"
        params.append(category_filter)
        
    if search_term:
        term = f"%{search_term.strip()}%"
        query += " AND (full_name LIKE ? OR phone_number LIKE ? OR ticket_code LIKE ? OR mpesa_reference LIKE ?)"
        params.extend([term, term, term, term])
        
    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_status(ticket_code, payment_status=None, checked_in=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if payment_status is not None and checked_in is not None:
        cursor.execute("UPDATE registrations SET payment_status = ?, checked_in = ? WHERE ticket_code = ?",
                       (payment_status, checked_in, ticket_code))
    elif payment_status is not None:
        cursor.execute("UPDATE registrations SET payment_status = ? WHERE ticket_code = ?",
                       (payment_status, ticket_code))
    elif checked_in is not None:
        cursor.execute("UPDATE registrations SET checked_in = ? WHERE ticket_code = ?",
                       (checked_in, ticket_code))
    conn.commit()
    conn.close()

def mark_paid_tinypesa(ticket_code, mpesa_code, tinypesa_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    m_code = (mpesa_code or '').strip().upper()
    t_id = (tinypesa_id or m_code).strip()
    cursor.execute("""
        UPDATE registrations 
        SET payment_status = 'Paid (M-Pesa)', 
            mpesa_reference = COALESCE(NULLIF(?, ''), mpesa_reference, ?),
            tinypesa_reference = ?,
            payment_blocked = 0
        WHERE UPPER(ticket_code) = UPPER(?)
    """, (m_code, m_code, t_id, ticket_code.strip()))
    conn.commit()
    cursor.execute("SELECT * FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def record_manual_payment_submission(ticket_code, mpesa_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    m_code = (mpesa_code or '').strip().upper()
    cursor.execute("""
        UPDATE registrations 
        SET mpesa_reference = COALESCE(NULLIF(?, ''), mpesa_reference),
            payment_status = 'Pending Verification'
        WHERE UPPER(ticket_code) = UPPER(?)
    """, (m_code, ticket_code.strip()))
    conn.commit()
    cursor.execute("SELECT * FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def increment_payment_attempts(ticket_code, reason=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT payment_attempts, payment_blocked FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    current_attempts = (row['payment_attempts'] or 0) + 1
    is_blocked = 1 if current_attempts >= 4 else (row['payment_blocked'] or 0)
    
    cursor.execute("""
        UPDATE registrations 
        SET payment_attempts = ?, payment_blocked = ?
        WHERE UPPER(ticket_code) = UPPER(?)
    """, (current_attempts, is_blocked, ticket_code.strip()))
    conn.commit()
    
    cursor.execute("SELECT * FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    updated = cursor.fetchone()
    conn.close()
    return dict(updated) if updated else None

def unblock_ticket(ticket_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE registrations 
        SET payment_blocked = 0, payment_attempts = 0
        WHERE UPPER(ticket_code) = UPPER(?)
    """, (ticket_code.strip(),))
    conn.commit()
    cursor.execute("SELECT * FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    updated = cursor.fetchone()
    conn.close()
    return dict(updated) if updated else None

def mark_paid_intasend(ticket_code, reference, mpesa_code=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    ref = reference or ''
    m_code = mpesa_code or ref
    cursor.execute("""
        UPDATE registrations 
        SET payment_status = 'Paid (IntaSend)', intasend_reference = ?, mpesa_reference = COALESCE(NULLIF(?, ''), mpesa_reference, ?)
        WHERE UPPER(ticket_code) = UPPER(?)
    """, (ref, m_code, ref, ticket_code.strip()))
    conn.commit()
    cursor.execute("SELECT * FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def mark_paid_paystack(ticket_code, reference):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE registrations 
        SET payment_status = 'Paid (Paystack)', paystack_reference = ?, mpesa_reference = COALESCE(NULLIF(mpesa_reference, ''), ?)
        WHERE UPPER(ticket_code) = UPPER(?)
    """, (reference, reference, ticket_code.strip()))
    conn.commit()
    cursor.execute("SELECT * FROM registrations WHERE UPPER(ticket_code) = UPPER(?)", (ticket_code.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def clear_all_registrations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM registrations")
    conn.commit()
    conn.close()

def get_statistics():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Only count confirmed / paid registrations
    cursor.execute("""
        SELECT COUNT(*) as total_count, COALESCE(SUM(amount_due), 0) as total_revenue 
        FROM registrations 
        WHERE payment_status LIKE '%Paid%' OR payment_status = 'Confirmed'
    """)
    total_stats = cursor.fetchone()
    
    cursor.execute("""
        SELECT category, COUNT(*) as count, COALESCE(SUM(amount_due), 0) as revenue 
        FROM registrations 
        WHERE payment_status LIKE '%Paid%' OR payment_status = 'Confirmed'
        GROUP BY category
    """)
    category_stats = {r['category']: {'count': r['count'], 'revenue': r['revenue']} for r in cursor.fetchall()}
    
    cursor.execute("""
        SELECT COUNT(*) as hire_count 
        FROM registrations 
        WHERE needs_hire = 1 AND (payment_status LIKE '%Paid%' OR payment_status = 'Confirmed')
    """)
    hire_stats = cursor.fetchone()
    
    cursor.execute("""
        SELECT COUNT(*) as checked_in_count 
        FROM registrations 
        WHERE checked_in = 1 AND (payment_status LIKE '%Paid%' OR payment_status = 'Confirmed')
    """)
    checkin_stats = cursor.fetchone()
    
    cursor.execute("""
        SELECT COUNT(*) as minor_count 
        FROM registrations 
        WHERE is_minor = 1 AND (payment_status LIKE '%Paid%' OR payment_status = 'Confirmed')
    """)
    minor_stats = cursor.fetchone()

    cursor.execute("""
        SELECT COUNT(*) as blocked_count 
        FROM registrations 
        WHERE payment_blocked = 1 AND payment_status NOT LIKE '%Paid%' AND payment_status != 'Confirmed'
    """)
    blocked_stats = cursor.fetchone()
    
    conn.close()
    return {
        "total_registrations": total_stats['total_count'] if total_stats else 0,
        "total_revenue": total_stats['total_revenue'] if total_stats else 0,
        "category_breakdown": category_stats,
        "equipment_hires": hire_stats['hire_count'] if hire_stats else 0,
        "checked_in_count": checkin_stats['checked_in_count'] if checkin_stats else 0,
        "minor_count": minor_stats['minor_count'] if minor_stats else 0,
        "blocked_count": blocked_stats['blocked_count'] if blocked_stats else 0
    }
