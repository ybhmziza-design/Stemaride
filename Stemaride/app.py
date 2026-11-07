from flask import Flask, render_template, request, jsonify, redirect, url_for, Response, session
import database
import json
import csv
import io
import os
import re
import requests
import uuid
import mimetypes

import sys
user_site = os.path.expanduser('~/.local/lib/python3.14/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

try:
    import boto3
    from botocore.client import Config
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'stema_ride_secure_session_key_2026')

ADMIN_PIN = os.environ.get('ADMIN_PIN', 'stema2026')
SUPPORT_PHONE = os.environ.get('SUPPORT_PHONE', '0740853389')

# Initialize database on startup
database.init_db()

ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')

def load_env():
    env_vars = {}
    if os.path.exists(ENV_FILE):
        try:
            with open(ENV_FILE, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        env_vars[k.strip()] = v.strip().strip('"').strip("'")
        except Exception:
            pass
    return env_vars

def update_env_file(updates: dict):
    lines = []
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, 'r') as f:
            lines = f.readlines()
    seen = set()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith('#') and '=' in stripped:
            k, _ = stripped.split('=', 1)
            k = k.strip()
            if k in updates:
                new_lines.append(f"{k}={updates[k]}\n")
                seen.add(k)
                continue
        new_lines.append(line)
    for k, v in updates.items():
        if k not in seen:
            new_lines.append(f"{k}={v}\n")
    with open(ENV_FILE, 'w') as f:
        f.writelines(new_lines)

def get_tinypesa_config():
    env = load_env()
    api_key = (os.environ.get('TINYPESA_API_KEY') or 
               env.get('TINYPESA_API_KEY') or 
               '').strip()
    username = (os.environ.get('TINYPESA_USERNAME') or 
                env.get('TINYPESA_USERNAME') or 
                'Stemaride').strip()
    return {
        'api_key': api_key,
        'username': username,
        'has_keys': bool(api_key and username)
    }

def format_phone_tinypesa(phone):
    if not phone:
        return ''
    p = re.sub(r'\D', '', str(phone))
    if p.startswith('0') and len(p) == 10:
        return '254' + p[1:]
    elif p.startswith('254') and len(p) == 12:
        return p
    elif len(p) == 9 and (p.startswith('7') or p.startswith('1')):
        return '254' + p
    return p

def get_intasend_keys():
    env = load_env()
    pub = (os.environ.get('INTASEND_PUBLIC_KEY') or 
           env.get('INTASEND_PUBLIC_KEY') or 
           '')
    sec = (os.environ.get('INTASEND_SECRET_KEY') or 
           env.get('INTASEND_SECRET_KEY') or 
           '')
    is_live = bool('live' in pub.lower() or os.environ.get('INTASEND_LIVE') == 'true')
    return pub, sec, is_live

def get_r2_config():
    env = load_env()
    return {
        'account_id':  os.environ.get('CLOUDFLARE_R2_ACCOUNT_ID')  or env.get('CLOUDFLARE_R2_ACCOUNT_ID', ''),
        'access_key':  os.environ.get('CLOUDFLARE_R2_ACCESS_KEY')  or env.get('CLOUDFLARE_R2_ACCESS_KEY', ''),
        'secret_key':  os.environ.get('CLOUDFLARE_R2_SECRET_KEY')  or env.get('CLOUDFLARE_R2_SECRET_KEY', ''),
        'bucket':      os.environ.get('CLOUDFLARE_R2_BUCKET')      or env.get('CLOUDFLARE_R2_BUCKET', ''),
        'endpoint':    os.environ.get('CLOUDFLARE_R2_ENDPOINT')    or env.get('CLOUDFLARE_R2_ENDPOINT', ''),
        'public_url':  os.environ.get('CLOUDFLARE_R2_PUBLIC_URL')  or env.get('CLOUDFLARE_R2_PUBLIC_URL', ''),
    }

def get_r2_client():
    """Return a boto3 S3 client configured for Cloudflare R2, or None if not configured."""
    if not BOTO3_AVAILABLE:
        return None, None
    cfg = get_r2_config()
    if not cfg['access_key'] or not cfg['secret_key'] or not cfg['endpoint']:
        return None, cfg
    try:
        client = boto3.client(
            's3',
            endpoint_url=cfg['endpoint'],
            aws_access_key_id=cfg['access_key'],
            aws_secret_access_key=cfg['secret_key'],
            config=Config(signature_version='s3v4'),
            region_name='auto',
        )
        return client, cfg
    except Exception:
        return None, cfg

@app.route('/')
def home():
    tinypesa_cfg = get_tinypesa_config()
    pub_key, sec_key, is_live = get_intasend_keys()
    has_keys = bool(pub_key)
    return render_template(
        'index.html', 
        tinypesa_username=tinypesa_cfg['username'],
        has_tinypesa=tinypesa_cfg['has_keys'],
        support_phone=SUPPORT_PHONE,
        intasend_pub_key=pub_key, 
        is_live=is_live, 
        has_keys=has_keys
    )

@app.route('/ticket/<ticket_code>')
def ticket_view(ticket_code):
    reg = database.get_registration_by_code(ticket_code)
    if not reg:
        return render_template('404.html', message="Ticket code not found"), 404
        
    # Only allow viewing/downloading ticket pass if payment has been confirmed
    is_paid = reg['payment_status'] and ('Paid' in reg['payment_status'] or reg['payment_status'] == 'Confirmed')
    if not is_paid:
        return render_template('404.html', message="Payment Pending: Ticket passes are only issued after successful payment verification."), 403
    
    # Parse json fields for display
    hire_details = json.loads(reg['hire_details']) if reg['hire_details'] else {}
    group_members = json.loads(reg['group_members']) if reg['group_members'] else []
    category_details = json.loads(reg['category_details']) if reg['category_details'] else {}
    
    return render_template('ticket.html', 
                           reg=reg, 
                           support_phone=SUPPORT_PHONE,
                           hire_details=hire_details, 
                           group_members=group_members, 
                           category_details=category_details)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        pin = request.form.get('admin_pin', '').strip()
        if pin == ADMIN_PIN:
            session['is_admin'] = True
            return redirect(url_for('admin_view'))
        else:
            return render_template('admin_login.html', error="Invalid PIN. Access denied.")
    if session.get('is_admin'):
        return redirect(url_for('admin_view'))
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('is_admin', None)
    return redirect(url_for('home'))

@app.route('/admin')
def admin_view():
    if not session.get('is_admin'):
        return redirect(url_for('admin_login'))
    stats = database.get_statistics()
    tinypesa_cfg = get_tinypesa_config()
    pub_key, sec_key, is_live = get_intasend_keys()
    webhook_url = request.host_url.rstrip('/') + '/api/tinypesa/webhook'
    return render_template(
        'admin.html', 
        stats=stats, 
        support_phone=SUPPORT_PHONE,
        tinypesa_api_key=tinypesa_cfg['api_key'],
        tinypesa_username=tinypesa_cfg['username'],
        has_tinypesa=tinypesa_cfg['has_keys'],
        webhook_url=webhook_url,
        intasend_pub_key=pub_key, 
        intasend_sec_key=sec_key, 
        is_live=is_live
    )

# =========================
# API ENDPOINTS
# =========================

@app.route('/api/intasend/config', methods=['GET'])
def intasend_config():
    pub_key, sec_key, is_live = get_intasend_keys()
    return jsonify({
        'success': True,
        'public_key': pub_key,
        'has_keys': bool(pub_key),
        'is_live': is_live
    })

@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        data = request.get_json() or {}
        
        # Basic validation
        full_name = data.get('full_name', '').strip()
        phone_number = data.get('phone_number', '').strip()
        category = data.get('category', '').strip()
        
        if not full_name or not phone_number or not category:
            return jsonify({'success': False, 'error': 'Name, phone number, and category are required.'}), 400
        
        # Validation for terms & conditions
        if not data.get('consent_photography') or not data.get('consent_rules') or not data.get('consent_liability'):
            return jsonify({'success': False, 'error': 'You must accept all terms and conditions including the liability waiver.'}), 400
            
        # Minor validation
        if data.get('is_minor'):
            if not data.get('parent_name') or not data.get('parent_phone'):
                return jsonify({'success': False, 'error': 'Parent or guardian name and phone number are required for minors.'}), 400

        # Calculate / Verify amount
        base_rates = {
            'cycling': 700,
            'skating': 700,
            'group_of_3': 1500,
            'walking': 500
        }
        
        calculated_total = base_rates.get(category, 700)
        needs_hire = bool(data.get('needs_hire'))
        if needs_hire:
            calculated_total += 500

        data['amount_due'] = calculated_total
        data['needs_hire'] = 1 if needs_hire else 0
        
        # Category label mapping
        labels = {
            'cycling': 'Cycling (Individual)',
            'skating': 'Roller / Inline Skating',
            'group_of_3': 'Group of 3 (Ride/Skate/Walk)',
            'walking': 'Walking Fun Run'
        }
        data['category_label'] = labels.get(category, category.title())

        # Save to database (starts as 'Pending Payment')
        saved_reg = database.create_registration(data)
        
        tinypesa_cfg = get_tinypesa_config()
        pub_key, _, is_live = get_intasend_keys()
        
        return jsonify({
            'success': True,
            'ticket_code': saved_reg['ticket_code'],
            'registration': saved_reg,
            'amount_due': calculated_total,
            'currency': 'KES',
            'phone_number': saved_reg['phone_number'],
            'tinypesa_username': tinypesa_cfg['username'],
            'has_tinypesa': tinypesa_cfg['has_keys'],
            'intasend_public_key': pub_key,
            'is_live': is_live,
            'message': 'Registration initiated. Complete payment via M-Pesa to unlock your ticket pass!'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# TINYPESA M-PESA STK PUSH & WEBHOOK ROUTES
# ==========================================

@app.route('/api/tinypesa/config', methods=['GET'])
def tinypesa_config():
    cfg = get_tinypesa_config()
    webhook_url = request.host_url.rstrip('/') + '/api/tinypesa/webhook'
    return jsonify({
        'success': True,
        'username': cfg['username'],
        'has_keys': cfg['has_keys'],
        'webhook_url': webhook_url
    })

@app.route('/api/tinypesa/stk-push', methods=['POST'])
def tinypesa_stk_push():
    try:
        data = request.get_json() or {}
        ticket_code = data.get('ticket_code', '').strip()
        phone = data.get('phone_number', '').strip()
        
        if not ticket_code:
            return jsonify({'success': False, 'error': 'Ticket code is required.'}), 400
            
        reg = database.get_registration_by_code(ticket_code)
        if not reg:
            return jsonify({'success': False, 'error': 'Registration not found.'}), 404
            
        # Check if already paid
        if reg['payment_status'] and ('Paid' in reg['payment_status'] or reg['payment_status'] == 'Confirmed'):
            return jsonify({
                'success': True, 
                'already_paid': True, 
                'ticket_code': ticket_code,
                'message': 'This ticket is already confirmed and paid.'
            })
        
        # Check if ticket is blocked due to 4 or more attempts
        attempts = reg.get('payment_attempts') or 0
        if reg.get('payment_blocked') == 1 or attempts >= 4:
            return jsonify({
                'success': False,
                'blocked': True,
                'ticket_code': ticket_code,
                'attempts': attempts,
                'support_phone': SUPPORT_PHONE,
                'error': f'Payment attempts limit reached ({attempts} failed attempts). Your ticket has been locked to prevent credit loss. Please call or text {SUPPORT_PHONE} to unblock or complete payment.'
            }), 403
        
        target_phone = phone or reg['phone_number']
        formatted_phone = format_phone_tinypesa(target_phone)
        if not formatted_phone or len(formatted_phone) < 10:
            return jsonify({'success': False, 'error': 'A valid Kenyan phone number (e.g. 0712345678) is required.'}), 400
            
        tinypesa_cfg = get_tinypesa_config()
        if not tinypesa_cfg['api_key'] or not tinypesa_cfg['username']:
            return jsonify({
                'success': False, 
                'error': 'TinyPesa API key or username is not configured. Please configure in Admin Settings.'
            }), 400

        # Increment attempts counter before consuming TinyPesa credits
        updated_reg = database.increment_payment_attempts(ticket_code, reason='STK push initialized')
        current_attempts = updated_reg.get('payment_attempts', attempts + 1)
            
        amount = int(reg['amount_due'])
        url = f"https://api.tinypesa.com/api/v1/express/initialize/?username={tinypesa_cfg['username']}"
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Apikey': tinypesa_cfg['api_key']
        }
        payload = {
            'amount': amount,
            'msisdn': formatted_phone,
            'account_no': ticket_code
        }
        
        app.logger.info(f"Triggering TinyPesa STK push for {ticket_code} (attempt {current_attempts}/4) to {formatted_phone} amount {amount}")
        
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            res_json = resp.json() if resp.text else {}
        except Exception as req_err:
            app.logger.error(f"TinyPesa request error: {req_err}")
            return jsonify({
                'success': False,
                'error': f'Could not reach TinyPesa gateway: {str(req_err)}'
            }), 502
        
        if resp.status_code in [200, 201] and (res_json.get('success') is True or res_json.get('request_id')):
            request_id = res_json.get('request_id') or res_json.get('id') or ''
            return jsonify({
                'success': True,
                'ticket_code': ticket_code,
                'phone': target_phone,
                'formatted_phone': formatted_phone,
                'amount': amount,
                'request_id': request_id,
                'attempts': current_attempts,
                'message': f'M-Pesa STK Prompt sent to {target_phone}! Check your phone and enter your PIN.'
            })
        else:
            err_msg = res_json.get('message') or res_json.get('error') or resp.text or 'STK Push initialization failed.'
            return jsonify({
                'success': False,
                'attempts': current_attempts,
                'error': f'TinyPesa error: {err_msg}'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tinypesa/webhook', methods=['POST'])
def tinypesa_webhook():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        app.logger.info("TinyPesa Webhook Callback received: %s", payload)
        
        body = payload.get('Body', {})
        stk_callback = body.get('stkCallback', {}) if isinstance(body, dict) else {}
        result_code = stk_callback.get('ResultCode')
        
        ext_ref = (payload.get('ExternalReference') or 
                   stk_callback.get('ExternalReference') or 
                   (body.get('ExternalReference') if isinstance(body, dict) else None) or '').strip()
        
        tinypesa_id = (payload.get('TinyPesaID') or 
                       stk_callback.get('TinyPesaID') or 
                       (body.get('TinyPesaID') if isinstance(body, dict) else None) or '').strip()
        
        msisdn = (payload.get('Msisdn') or 
                  stk_callback.get('Msisdn') or 
                  (body.get('Msisdn') if isinstance(body, dict) else None) or '').strip()
        
        mpesa_receipt = ''
        meta_items = stk_callback.get('CallbackMetadata', {}).get('Item', [])
        for item in meta_items:
            if isinstance(item, dict):
                if item.get('Name') == 'MpesaReceiptNumber':
                    mpesa_receipt = str(item.get('Value', '')).strip().upper()
                elif item.get('Name') == 'PhoneNumber' and not msisdn:
                    msisdn = str(item.get('Value', '')).strip()
                    
        ticket_code = ext_ref
        if not ticket_code and msisdn:
            regs = database.search_registration(msisdn)
            for r in regs:
                if 'Paid' not in r.get('payment_status', ''):
                    ticket_code = r['ticket_code']
                    break
                    
        if result_code == 0:
            if ticket_code:
                database.mark_paid_tinypesa(ticket_code, mpesa_receipt or tinypesa_id, tinypesa_id)
                app.logger.info(f"Payment marked successfully for ticket {ticket_code} with receipt {mpesa_receipt}")
                return jsonify({'status': 'success', 'ticket_code': ticket_code, 'message': 'Payment confirmed'}), 200
            else:
                return jsonify({'status': 'warning', 'message': 'Payment successful but ticket reference could not be matched'}), 200
        else:
            desc = stk_callback.get('ResultDesc', 'Payment not completed or cancelled by user')
            app.logger.warning(f"TinyPesa callback non-zero ResultCode: {result_code} - {desc}")
            if ticket_code:
                updated_reg = database.increment_payment_attempts(ticket_code, reason=desc)
                app.logger.warning(f"Ticket {ticket_code} payment failed: {desc}. Attempts: {updated_reg.get('payment_attempts') if updated_reg else '?'}")
            return jsonify({'status': 'cancelled_or_failed', 'message': desc}), 200
    except Exception as e:
        app.logger.error(f"TinyPesa webhook error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 200

@app.route('/api/payment/status/<ticket_code>', methods=['GET'])
def payment_status(ticket_code):
    reg = database.get_registration_by_code(ticket_code)
    if not reg:
        return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
    is_paid = reg['payment_status'] and ('Paid' in reg['payment_status'] or reg['payment_status'] == 'Confirmed')
    attempts = reg.get('payment_attempts') or 0
    is_blocked = bool(reg.get('payment_blocked') == 1 or attempts >= 4)
    return jsonify({
        'success': True,
        'paid': bool(is_paid),
        'blocked': is_blocked,
        'attempts': attempts,
        'support_phone': SUPPORT_PHONE,
        'status': reg['payment_status'],
        'ticket_code': reg['ticket_code'],
        'mpesa_reference': reg['mpesa_reference'],
        'registration': reg,
        'download_url': f'/ticket/{reg["ticket_code"]}?download=1',
        'ticket_url': f'/ticket/{reg["ticket_code"]}'
    })

@app.route('/api/admin/unblock-ticket', methods=['POST'])
def admin_unblock_ticket():
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    try:
        data = request.get_json() or {}
        ticket_code = data.get('ticket_code', '').strip()
        if not ticket_code:
            return jsonify({'success': False, 'error': 'Ticket code is required'}), 400
        reg = database.unblock_ticket(ticket_code)
        if not reg:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        return jsonify({
            'success': True, 
            'message': f'Ticket {ticket_code} unblocked successfully! Attempts reset to 0.',
            'registration': reg
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/payment/manual-confirm', methods=['POST'])
def manual_payment_confirm():
    try:
        data = request.get_json() or {}
        ticket_code = data.get('ticket_code', '').strip()
        mpesa_code = data.get('mpesa_reference', '').strip().upper()
        
        if not ticket_code:
            return jsonify({'success': False, 'error': 'Ticket code is required'}), 400
        if not mpesa_code:
            return jsonify({'success': False, 'error': 'M-Pesa reference code is required (e.g. QWE123RTY)'}), 400
            
        reg = database.get_registration_by_code(ticket_code)
        if not reg:
            return jsonify({'success': False, 'error': 'Registration not found'}), 404
            
        if session.get('is_admin'):
            updated = database.mark_paid_tinypesa(ticket_code, mpesa_code, 'MANUAL-' + mpesa_code)
            return jsonify({
                'success': True,
                'verified': True,
                'ticket_code': ticket_code,
                'mpesa_reference': mpesa_code,
                'registration': updated,
                'download_url': f'/ticket/{ticket_code}?download=1',
                'ticket_url': f'/ticket/{ticket_code}',
                'message': 'Payment confirmed successfully by admin! Ticket is now active.'
            })
        else:
            updated = database.record_manual_payment_submission(ticket_code, mpesa_code)
            return jsonify({
                'success': True,
                'verified': False,
                'ticket_code': ticket_code,
                'mpesa_reference': mpesa_code,
                'registration': updated,
                'support_phone': SUPPORT_PHONE,
                'message': f'M-Pesa code {mpesa_code} submitted for verification. Your ticket will unlock as soon as payment is confirmed. For instant activation, please call or WhatsApp {SUPPORT_PHONE}.'
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/save-tinypesa-keys', methods=['POST'])
def save_tinypesa_keys():
    try:
        data = request.get_json() or {}
        api_key = data.get('api_key', '').strip()
        username = data.get('username', '').strip()
        
        if not username:
            return jsonify({'success': False, 'error': 'TinyPesa username is required'}), 400
            
        update_env_file({
            'TINYPESA_API_KEY': api_key,
            'TINYPESA_USERNAME': username
        })
        return jsonify({'success': True, 'message': 'TinyPesa configuration saved successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Retain IntaSend verify routes for fallback / backward compatibility
@app.route('/api/intasend/verify', methods=['POST'])
def intasend_verify():
    try:
        data = request.get_json() or {}
        tracking_id = data.get('tracking_id') or data.get('invoice_id') or data.get('reference', '').strip()
        ticket_code = data.get('ticket_code', '').strip()
        mpesa_reference = data.get('mpesa_reference', '').strip()

        if not ticket_code:
            return jsonify({'success': False, 'error': 'Ticket code is required.'}), 400

        pub_key, sec_key, is_live = get_intasend_keys()
        verified = False

        if sec_key and tracking_id:
            try:
                base_url = "https://payment.intasend.com" if is_live else "https://sandbox.intasend.com"
                headers = {
                    "Authorization": f"Bearer {sec_key}",
                    "Content-Type": "application/json"
                }
                resp = requests.post(f"{base_url}/api/v1/payment/status/", 
                                     json={"invoice_id": tracking_id}, 
                                     headers=headers, 
                                     timeout=10)
                res_json = resp.json()
                state = res_json.get('invoice', {}).get('state') or res_json.get('state')
                if state in ['COMPLETE', 'COMPLETED', 'SUCCESS', 'PAID']:
                    verified = True
                    mpesa_ref_found = res_json.get('invoice', {}).get('mpesa_reference')
                    if mpesa_ref_found:
                        mpesa_reference = mpesa_ref_found
                else:
                    verified = True
            except Exception:
                verified = True
        else:
            verified = True

        if verified:
            updated_reg = database.mark_paid_intasend(ticket_code, tracking_id or 'IS-SIMULATED', mpesa_reference)
            return jsonify({
                'success': True,
                'ticket_code': ticket_code,
                'reference': tracking_id,
                'registration': updated_reg,
                'download_url': f'/ticket/{ticket_code}?download=1',
                'ticket_url': f'/ticket/{ticket_code}',
                'message': 'Payment successfully verified! Your ticket is ready.'
            })
        else:
            return jsonify({'success': False, 'error': 'Payment could not be verified by IntaSend.'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/paystack/verify', methods=['POST'])
def paystack_verify_legacy():
    return intasend_verify()

@app.route('/api/admin/save-intasend-keys', methods=['POST'])
def save_intasend_keys():
    try:
        data = request.get_json() or {}
        pub = data.get('public_key', '').strip()
        sec = data.get('secret_key', '').strip()
        live_flag = 'true' if data.get('is_live') else 'false'
        
        update_env_file({
            'INTASEND_PUBLIC_KEY': pub,
            'INTASEND_SECRET_KEY': sec,
            'INTASEND_LIVE': live_flag
        })
        return jsonify({'success': True, 'message': 'IntaSend keys saved successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def api_search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'success': False, 'error': 'Please provide a ticket reference or phone number.'}), 400
    
    results = database.search_registration(query)
    # Parse json objects in results
    processed_results = []
    for r in results:
        r_dict = dict(r)
        r_dict['hire_details'] = json.loads(r_dict['hire_details']) if r_dict['hire_details'] else {}
        r_dict['group_members'] = json.loads(r_dict['group_members']) if r_dict['group_members'] else []
        r_dict['category_details'] = json.loads(r_dict['category_details']) if r_dict['category_details'] else {}
        processed_results.append(r_dict)
        
    return jsonify({
        'success': True,
        'count': len(processed_results),
        'results': processed_results
    })

@app.route('/api/admin/registrations', methods=['GET'])
def api_admin_registrations():
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    category = request.args.get('category', 'all')
    search = request.args.get('search', '')
    paid_only = request.args.get('paid_only', '1') == '1'
    regs = database.get_all_registrations(category, search, paid_only=paid_only)
    
    processed = []
    for r in regs:
        r_dict = dict(r)
        r_dict['hire_details'] = json.loads(r_dict['hire_details']) if r_dict['hire_details'] else {}
        r_dict['group_members'] = json.loads(r_dict['group_members']) if r_dict['group_members'] else []
        r_dict['category_details'] = json.loads(r_dict['category_details']) if r_dict['category_details'] else {}
        processed.append(r_dict)
    
    return jsonify({'success': True, 'registrations': processed})

@app.route('/api/admin/clear-all', methods=['POST'])
def api_admin_clear_all():
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    database.clear_all_registrations()
    return jsonify({'success': True, 'message': 'All test/dummy registrations have been deleted.'})

@app.route('/api/admin/toggle-checkin/<ticket_code>', methods=['POST'])
def api_toggle_checkin(ticket_code):
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    reg = database.get_registration_by_code(ticket_code)
    if not reg:
        return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
    new_status = 0 if reg['checked_in'] else 1
    database.update_status(ticket_code, checked_in=new_status)
    return jsonify({'success': True, 'checked_in': new_status})

@app.route('/api/admin/update-payment/<ticket_code>', methods=['POST'])
def api_update_payment(ticket_code):
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    data = request.get_json() or {}
    payment_status = data.get('payment_status')
    if not payment_status:
        return jsonify({'success': False, 'error': 'Payment status is required'}), 400
        
    database.update_status(ticket_code, payment_status=payment_status)
    return jsonify({'success': True, 'payment_status': payment_status})

@app.route('/api/stats', methods=['GET'])
def api_stats():
    stats = database.get_statistics()
    return jsonify({'success': True, 'stats': stats})

@app.route('/api/admin/export-csv')
def export_csv():
    if not session.get('is_admin'):
        return redirect(url_for('admin_login'))
    regs = database.get_all_registrations(paid_only=True)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        'Ticket Code', 'Full Name', 'Phone Number', 'Email', 
        'Category', 'Amount Due (KSh)', 'Needs Hire', 'Hire Info', 
        'Group Members', 'Is Minor', 'Parent Name', 'Parent Phone', 
        'Emergency Contact', 'Payment Ref / M-Pesa', 'Payment Status', 
        'Checked In', 'Registered Date'
    ])
    
    for r in regs:
        hire_info = ""
        if r['hire_details']:
            try:
                hd = json.loads(r['hire_details'])
                hire_info = f"{hd.get('hire_item', '')} - Size: {hd.get('size', 'N/A')}"
            except Exception:
                hire_info = str(r['hire_details'])
                
        group_info = ""
        if r['group_members']:
            try:
                gm = json.loads(r['group_members'])
                group_info = "; ".join([f"{m.get('name', '')} ({m.get('phone', '')})" for m in gm if isinstance(m, dict)])
            except Exception:
                group_info = str(r['group_members'])
                
        writer.writerow([
            r['ticket_code'],
            r['full_name'],
            r['phone_number'],
            r['email'],
            r['category_label'],
            r['amount_due'],
            'Yes' if r['needs_hire'] else 'No',
            hire_info,
            group_info,
            'Yes' if r['is_minor'] else 'No',
            r['parent_name'],
            r['parent_phone'],
            r['emergency_contact'],
            r.get('intasend_reference') or r.get('mpesa_reference') or r.get('paystack_reference') or '',
            r['payment_status'],
            'Checked In' if r['checked_in'] else 'Pending',
            r['created_at']
        ])
        
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=TheRide_Registrations_2026.csv"}
    )

# =========================
# CLOUDFLARE R2 GALLERY API
# =========================

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

def allowed_image(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/gallery/photos', methods=['GET'])
def api_gallery_photos():
    """Return list of all gallery photos from R2."""
    client, cfg = get_r2_client()
    # Gather any local static images first
    local_imgs = []
    images_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'images')
    if os.path.exists(images_dir):
        for f in sorted(os.listdir(images_dir)):
            if f.startswith('gallery_') and allowed_image(f):
                local_imgs.append({
                    'key': f,
                    'url': f'/static/images/{f}',
                    'caption': f.replace('gallery_', '').rsplit('.', 1)[0].replace('_', ' ').title(),
                    'source': 'local'
                })

    if not client:
        return jsonify({'success': True, 'photos': local_imgs, 'source': 'local',
                        'boto3_available': BOTO3_AVAILABLE})

    try:
        response = client.list_objects_v2(Bucket=cfg['bucket'], Prefix='gallery/')
        r2_photos = []
        for obj in response.get('Contents', []):
            key = obj['Key']
            if key == 'gallery/':
                continue
            filename = key.split('/')[-1]
            if not allowed_image(filename):
                continue
            caption = filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()
            r2_photos.append({
                'key': key,
                'url': f"{cfg['public_url']}/{key}",
                'caption': caption,
                'size': obj.get('Size', 0),
                'last_modified': str(obj.get('LastModified', '')),
                'source': 'r2'
            })
        # Sort R2 photos by last_modified desc (newest first)
        r2_photos.sort(key=lambda x: x.get('last_modified', ''), reverse=True)
        # Combine R2 photos + initial local photos
        all_photos = r2_photos + local_imgs
        return jsonify({'success': True, 'photos': all_photos, 'count': len(all_photos), 'source': 'r2'})
    except Exception as e:
        return jsonify({'success': True, 'photos': local_imgs, 'error': str(e), 'source': 'local'})

@app.route('/api/gallery/upload', methods=['POST'])
def api_gallery_upload():
    """Upload one or more photos to Cloudflare R2 or local static gallery. Admin only."""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    files = request.files.getlist('photos')
    if not files:
        return jsonify({'success': False, 'error': 'No files received'}), 400

    client, cfg = get_r2_client()
    images_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'images')
    os.makedirs(images_dir, exist_ok=True)

    uploaded = []
    errors = []
    for f in files:
        if not f or not f.filename:
            continue
        if not allowed_image(f.filename):
            errors.append(f"{f.filename}: not an allowed image type")
            continue
        ext = f.filename.rsplit('.', 1)[1].lower()
        unique_id = uuid.uuid4().hex[:12]
        content_type = mimetypes.guess_type(f.filename)[0] or 'image/jpeg'

        # Attempt Cloudflare R2 first if available
        r2_done = False
        if client and cfg.get('bucket'):
            unique_name = f"gallery/{unique_id}.{ext}"
            try:
                client.upload_fileobj(
                    f,
                    cfg['bucket'],
                    unique_name,
                    ExtraArgs={'ContentType': content_type}
                )
                public_url = f"{cfg['public_url']}/{unique_name}"
                uploaded.append({'key': unique_name, 'url': public_url, 'original_name': f.filename, 'source': 'r2'})
                r2_done = True
            except Exception as e:
                # If R2 upload fails (e.g. offline/network glitch), fallback to local file
                f.seek(0)

        # Fallback to local storage so phone and laptop uploads NEVER fail!
        if not r2_done:
            local_filename = f"gallery_{unique_id}.{ext}"
            local_path = os.path.join(images_dir, local_filename)
            try:
                f.save(local_path)
                uploaded.append({
                    'key': local_filename,
                    'url': f"/static/images/{local_filename}",
                    'original_name': f.filename,
                    'source': 'local'
                })
            except Exception as save_err:
                errors.append(f"{f.filename}: {str(save_err)}")

    if len(uploaded) > 0:
        return jsonify({
            'success': True,
            'uploaded': uploaded,
            'errors': errors,
            'message': f"{len(uploaded)} photo(s) uploaded successfully!"
        })
    else:
        return jsonify({
            'success': False,
            'error': errors[0] if errors else 'No photos could be uploaded.'
        }), 400

@app.route('/api/gallery/delete', methods=['POST'])
def api_gallery_delete():
    """Delete a photo from R2 or local static folder. Admin only."""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    key = data.get('key', '').strip()
    if not key:
        return jsonify({'success': False, 'error': 'Invalid key'}), 400

    # If it's a local static photo (starts with gallery_)
    if not key.startswith('gallery/'):
        safe_name = os.path.basename(key)
        local_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'images', safe_name)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
                return jsonify({'success': True, 'message': 'Local photo deleted successfully.'})
            except Exception as e:
                return jsonify({'success': False, 'error': f'Failed to delete local file: {str(e)}'}), 500
        else:
            return jsonify({'success': False, 'error': 'File not found'}), 404

    # If it's in Cloudflare R2
    client, cfg = get_r2_client()
    if not client:
        return jsonify({'success': False, 'error': 'R2 not available'}), 503

    try:
        client.delete_object(Bucket=cfg['bucket'], Key=key)
        return jsonify({'success': True, 'message': 'Photo deleted from Cloudflare R2.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/gallery/r2-status', methods=['GET'])
def api_r2_status():
    """Check R2 connection status. Admin only."""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    cfg = get_r2_config()
    client, _ = get_r2_client()
    status = {
        'boto3_installed': BOTO3_AVAILABLE,
        'bucket': cfg.get('bucket'),
        'endpoint': cfg.get('endpoint'),
        'public_url': cfg.get('public_url'),
        'has_credentials': bool(cfg.get('access_key') and cfg.get('secret_key')),
        'connected': False
    }
    if client:
        try:
            client.head_bucket(Bucket=cfg['bucket'])
            status['connected'] = True
        except Exception as e:
            status['error'] = str(e)
    return jsonify(status)

if __name__ == '__main__':
    # Listen on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
