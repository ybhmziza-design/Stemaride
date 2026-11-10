// Admin JavaScript for THE RIDE 2026 Organizer Portal

let debounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadRegistrations();
});

function debounceSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        loadRegistrations();
    }, 300);
}

async function loadRegistrations() {
    const tbody = document.getElementById('registrations-tbody');
    const category = document.getElementById('admin-category-filter').value;
    const search = document.getElementById('admin-search').value.trim();

    try {
        const url = `/api/admin/registrations?category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}&paid_only=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.success || data.registrations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-slate-500">
                        No registrations found matching the current filter.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        data.registrations.forEach(r => {
            const isCheckedIn = r.checked_in == 1;
            const checkInBtnClass = isCheckedIn 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700';
            const checkInIcon = isCheckedIn ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
            const checkInText = isCheckedIn ? 'Checked In' : 'Check In';

            // Details compilation
            let details = [];
            if (r.category === 'group_of_3' && r.group_members && r.group_members.length) {
                const names = r.group_members.map(m => `${m.name} (${m.phone})`).join(', ');
                details.push(`<span class="text-sky-400 font-bold">Group:</span> ${names}`);
            }
            if (r.needs_hire && r.hire_details) {
                details.push(`<span class="text-orange-400 font-bold">Hire:</span> ${r.hire_details.hire_item || 'Gear'} - ${r.hire_details.size || ''}`);
            }
            if (r.is_minor) {
                details.push(`<span class="text-amber-400 font-bold">Minor:</span> Guardian: ${r.parent_name || 'N/A'} (${r.parent_phone || ''})`);
            }
            if (r.consent_photography === 0 || r.photo_no_consent_names) {
                details.push(`<span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5"><i class="fa-solid fa-ban mr-1"></i>No Photo: ${r.photo_no_consent_names || r.full_name}</span>`);
            }
            if (details.length === 0) {
                details.push(`<span class="text-slate-500">Standard Solo</span>`);
            }

            html += `
                <tr class="hover:bg-slate-950/40 transition">
                    <td class="py-3 px-4 font-mono font-bold text-yellow-400">
                        <a href="/ticket/${r.ticket_code}" target="_blank" class="hover:underline flex items-center gap-1">
                            ${r.ticket_code}
                            <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                        </a>
                    </td>
                    <td class="py-3 px-4 font-bold text-white">
                        ${r.full_name}
                    </td>
                    <td class="py-3 px-4">
                        <div class="text-slate-200">${r.phone_number}</div>
                        ${r.email ? `<div class="text-[10px] text-slate-500">${r.email}</div>` : ''}
                    </td>
                    <td class="py-3 px-4">
                        <div class="font-bold text-slate-200">${r.category_label}</div>
                        <div class="text-yellow-400 font-extrabold text-[11px]">KSh ${r.amount_due}</div>
                    </td>
                    <td class="py-3 px-4 max-w-xs text-[11px] space-y-0.5">
                        ${details.join('<br>')}
                    </td>
                    <td class="py-3 px-4">
                        ${r.mpesa_reference ? `<div class="font-mono text-[11px] text-emerald-400 font-bold">${r.mpesa_reference}</div>` : '<div class="text-slate-500 text-[10px]">No Code</div>'}
                        <select onchange="updatePaymentStatus('${r.ticket_code}', this.value)" class="mt-1 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300">
                            <option value="Confirmed" ${r.payment_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="Pending Payment" ${r.payment_status === 'Pending Payment' ? 'selected' : ''}>Pending</option>
                            <option value="Paid (M-Pesa)" ${r.payment_status?.includes('Paid') ? 'selected' : ''}>Paid (M-Pesa)</option>
                            <option value="Paid Cash" ${r.payment_status === 'Paid Cash' ? 'selected' : ''}>Paid Cash</option>
                        </select>
                        ${(r.payment_blocked || (r.payment_attempts >= 4 && !r.payment_status?.includes('Paid'))) ? `
                            <span class="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold block mt-1">
                                <i class="fa-solid fa-lock mr-0.5"></i>Locked (${r.payment_attempts || 4}/4)
                            </span>
                        ` : ''}
                    </td>
                    <td class="py-3 px-4 text-center">
                        <button onclick="toggleCheckIn('${r.ticket_code}')" class="px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 mx-auto ${checkInBtnClass}">
                            <i class="${checkInIcon}"></i>
                            <span>${checkInText}</span>
                        </button>
                    </td>
                    <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        ${(r.payment_blocked || (r.payment_attempts >= 4 && !r.payment_status?.includes('Paid'))) ? `
                            <button onclick="unblockTicket('${r.ticket_code}')" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded-lg font-bold text-xs transition inline-flex items-center gap-1" title="Unblock ticket and reset attempts to 0">
                                <i class="fa-solid fa-lock-open text-[10px]"></i> Unblock
                            </button>
                        ` : ''}
                        <a href="/ticket/${r.ticket_code}" target="_blank" class="text-yellow-400 hover:text-yellow-300 font-bold text-xs p-1 inline-flex items-center gap-1">
                            <i class="fa-solid fa-ticket"></i> Pass
                        </a>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        refreshStats();

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-red-400">Failed to load registrations.</td></tr>`;
    }
}

async function toggleCheckIn(ticketCode) {
    try {
        const res = await fetch(`/api/admin/toggle-checkin/${ticketCode}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            loadRegistrations();
        }
    } catch (e) {
        alert("Failed to toggle check-in status");
    }
}

async function updatePaymentStatus(ticketCode, status) {
    try {
        const res = await fetch(`/api/admin/update-payment/${ticketCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: status })
        });
        const data = await res.json();
        if (!data.success) {
            alert("Failed to update status");
        } else {
            loadRegistrations();
        }
    } catch (e) {
        alert("Server error updating payment status");
    }
}

async function unblockTicket(ticketCode) {
    if (!confirm(`Unblock ticket ${ticketCode}?\nThis will reset payment attempts to 0 and allow the participant to trigger M-Pesa STK push again.`)) return;
    try {
        const res = await fetch('/api/admin/unblock-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_code: ticketCode })
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            loadRegistrations();
        } else {
            alert(data.error || "Failed to unblock ticket");
        }
    } catch (e) {
        alert("Server error unblocking ticket.");
    }
}

async function refreshStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
            const s = data.stats;
            document.getElementById('kpi-total-registrations').innerText = s.total_registrations;
            document.getElementById('kpi-total-revenue').innerText = `KSh ${s.total_revenue.toLocaleString()}`;
            document.getElementById('kpi-equipment-hires').innerText = s.equipment_hires;
            document.getElementById('kpi-minors').innerText = s.minor_count;
            document.getElementById('kpi-checked-in').innerText = s.checked_in_count;
            const blockedEl = document.getElementById('kpi-blocked-count');
            if (blockedEl) blockedEl.innerText = s.blocked_count || 0;
        }
    } catch (e) {}
}

async function saveTinyPesaKeys(e) {
    e.preventDefault();
    const user = document.getElementById('cfg-tinypesa-user').value.trim();
    const apiKey = document.getElementById('cfg-tinypesa-key').value.trim();
    const btn = document.getElementById('save-tinypesa-btn');
    const originalText = btn.innerHTML;

    if (!user) {
        alert("Please enter your TinyPesa short link username.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

    try {
        const res = await fetch('/api/admin/save-tinypesa-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, api_key: apiKey })
        });
        const data = await res.json();
        if (data.success) {
            alert("TinyPesa configuration saved successfully! M-Pesa STK push is active.");
            window.location.reload();
        } else {
            alert("Failed to save configuration: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        alert("Error saving TinyPesa configuration.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function copyWebhookUrl() {
    const el = document.getElementById('webhook-url-text');
    if (!el) return;
    const text = el.innerText.trim();
    navigator.clipboard.writeText(text).then(() => {
        const label = document.getElementById('copy-webhook-label');
        if (label) {
            label.innerText = 'Copied!';
            setTimeout(() => { label.innerText = 'Copy Webhook'; }, 2000);
        }
    }).catch(() => {
        prompt("Copy this TinyPesa Webhook Callback URL:", text);
    });
}

async function saveIntaSendKeys(e) {
    e.preventDefault();
    const pubKey = document.getElementById('cfg-pub-key').value.trim();
    const secKey = document.getElementById('cfg-sec-key').value.trim();
    const isLive = document.getElementById('cfg-is-live').checked;
    const btn = document.getElementById('save-keys-btn');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

    try {
        const res = await fetch('/api/admin/save-intasend-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_key: pubKey, secret_key: secKey, is_live: isLive })
        });
        const data = await res.json();
        if (data.success) {
            alert("IntaSend configuration saved successfully! Changes are active.");
            window.location.reload();
        } else {
            alert("Failed to save keys: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        alert("Error saving IntaSend configuration.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function confirmClearAll() {
    const confirmation = prompt("⚠️ WARNING: This will permanently delete ALL registration records.\nType 'CLEAR' in all caps to confirm:");
    if (confirmation !== 'CLEAR') {
        if (confirmation !== null) alert("Clear operation cancelled.");
        return;
    }

    try {
        const res = await fetch('/api/admin/clear-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message || "All records have been cleared.");
            window.location.reload();
        } else {
            alert("Error: " + (data.error || "Failed to clear records."));
        }
    } catch (e) {
        alert("Server error occurred while clearing records.");
    }
}

// ==========================================
// CLOUDFLARE R2 GALLERY MANAGEMENT
// ==========================================

async function checkR2Status() {
    const badge = document.getElementById('r2-status-badge');
    if (!badge) return;
    try {
        const res = await fetch('/api/gallery/r2-status');
        const data = await res.json();
        if (data.connected) {
            badge.className = "text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold";
            badge.innerHTML = "🟢 Cloud Ready (" + (data.bucket || 'R2 Bucket') + ")";
        } else {
            badge.className = "text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold";
            badge.innerHTML = "🟢 Storage Ready (Direct Upload)";
        }
    } catch (e) {
        badge.className = "text-xs bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-1 rounded-full font-bold";
        badge.innerHTML = "🔴 Status Check Failed";
    }
}

async function loadAdminGallery() {
    const grid = document.getElementById('admin-gallery-grid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="col-span-full text-center py-6 text-slate-500 text-xs">
            <i class="fa-solid fa-spinner fa-spin mr-1"></i> Refreshing photos...
        </div>
    `;

    try {
        const res = await fetch('/api/gallery/photos');
        const data = await res.json();

        if (!data.success || !data.photos || data.photos.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8 text-slate-500 text-xs">
                    <i class="fa-solid fa-images text-2xl mb-2 block text-slate-600"></i>
                    No photos found. Drop images above to add to the gallery!
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        data.photos.forEach(photo => {
            const card = document.createElement('div');
            card.className = "relative group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow";
            card.innerHTML = `
                <img src="${photo.url}" alt="${photo.caption}" class="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="p-2">
                    <p class="text-[11px] font-semibold text-slate-200 truncate" title="${photo.caption}">${photo.caption}</p>
                    <div class="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                        <span class="px-1.5 py-0.5 rounded ${photo.source === 'r2' ? 'bg-purple-900/40 text-purple-300' : 'bg-slate-800 text-slate-400'}">${photo.source === 'r2' ? 'Cloud' : 'Local'}</span>
                        <button onclick="deleteGalleryPhoto('${photo.key}')" class="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition text-xs font-semibold" title="Delete Photo">
                            <i class="fa-solid fa-trash-can mr-1"></i>Delete
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-6 text-rose-400 text-xs">
                Failed to load gallery photos.
            </div>
        `;
    }
}

function handleGalleryDrop(e) {
    e.preventDefault();
    const dropZone = document.getElementById('gallery-drop-zone');
    if (dropZone) dropZone.classList.remove('border-purple-400');
    if (e.dataTransfer && e.dataTransfer.files) {
        uploadGalleryPhotos(e.dataTransfer.files);
    }
}

async function uploadGalleryPhotos(files) {
    if (!files || files.length === 0) return;

    const progressBox = document.getElementById('gallery-upload-progress');
    const progressBar = document.getElementById('gallery-upload-bar');
    const progressMsg = document.getElementById('gallery-upload-msg');

    if (progressBox) progressBox.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '30%';
    if (progressMsg) progressMsg.textContent = `Uploading ${files.length} photo(s) to Cloudflare R2...`;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
    }

    try {
        if (progressBar) progressBar.style.width = '70%';
        const res = await fetch('/api/gallery/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (progressBar) progressBar.style.width = '100%';

        if (data.success) {
            if (progressMsg) progressMsg.textContent = data.message || "Upload complete!";
            setTimeout(() => {
                if (progressBox) progressBox.classList.add('hidden');
                if (progressBar) progressBar.style.width = '0%';
            }, 2000);
            loadAdminGallery();
        } else {
            alert("Upload notice: " + (data.error || "Unable to process uploaded files."));
            if (progressBox) progressBox.classList.add('hidden');
        }
    } catch (err) {
        alert("Upload error: Could not reach the server.");
        if (progressBox) progressBox.classList.add('hidden');
    }
}

async function deleteGalleryPhoto(key) {
    if (!confirm("Are you sure you want to delete this photo from the gallery?")) return;

    try {
        const res = await fetch('/api/gallery/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        const data = await res.json();
        if (data.success) {
            loadAdminGallery();
        } else {
            alert("Error: " + (data.error || "Failed to delete photo."));
        }
    } catch (e) {
        alert("Server error occurred while deleting photo.");
    }
}

// Initialize gallery on admin page load
document.addEventListener('DOMContentLoaded', () => {
    checkR2Status();
    loadAdminGallery();
});

async function sendAdminTestStkPush() {
    const phoneInput = document.getElementById('test-stk-phone');
    const amountInput = document.getElementById('test-stk-amount');
    const resultBox = document.getElementById('test-stk-result');
    const btn = document.getElementById('test-stk-btn');

    const phone = phoneInput ? phoneInput.value.trim() : '';
    const amount = amountInput ? parseInt(amountInput.value) || 20 : 20;

    if (!phone) {
        alert("Please enter a valid phone number to test.");
        return;
    }

    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;
    if (resultBox) {
        resultBox.classList.remove('hidden', 'text-rose-400', 'text-emerald-400');
        resultBox.classList.add('text-slate-400');
        resultBox.innerText = `Connecting to TinyPesa... requesting prompt for KSh ${amount}...`;
    }

    try {
        const res = await fetch('/api/tinypesa/test-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: phone, amount })
        });
        const data = await res.json();
        if (data.success) {
            resultBox.classList.remove('text-slate-400');
            resultBox.classList.add('text-emerald-400');
            resultBox.innerHTML = `✅ <strong>Success!</strong> ${data.message}`;
        } else {
            resultBox.classList.remove('text-slate-400');
            resultBox.classList.add('text-rose-400');
            resultBox.innerHTML = `❌ <strong>Failed:</strong> ${data.error || 'STK Push could not be initiated.'}`;
        }
    } catch (err) {
        resultBox.classList.remove('text-slate-400');
        resultBox.classList.add('text-rose-400');
        resultBox.innerHTML = `❌ <strong>Network Error:</strong> ${err.message}`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
    }
}
