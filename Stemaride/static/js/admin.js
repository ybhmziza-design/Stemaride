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
                            <option value="Pending Verification" ${r.payment_status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                            <option value="Paid Cash" ${r.payment_status === 'Paid Cash' ? 'selected' : ''}>Paid Cash</option>
                        </select>
                    </td>
                    <td class="py-3 px-4 text-center">
                        <button onclick="toggleCheckIn('${r.ticket_code}')" class="px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 mx-auto ${checkInBtnClass}">
                            <i class="${checkInIcon}"></i>
                            <span>${checkInText}</span>
                        </button>
                    </td>
                    <td class="py-3 px-4 text-right">
                        <a href="/ticket/${r.ticket_code}" target="_blank" class="text-yellow-400 hover:text-yellow-300 font-bold text-xs p-1">
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
        }
    } catch (e) {
        alert("Server error updating payment status");
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
        }
    } catch (e) {}
}

async function savePaystackKeys(e) {
    e.preventDefault();
    const pubKey = document.getElementById('cfg-pub-key').value.trim();
    const secKey = document.getElementById('cfg-sec-key').value.trim();
    const btn = document.getElementById('save-keys-btn');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

    try {
        const res = await fetch('/api/admin/save-paystack-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_key: pubKey, secret_key: secKey })
        });
        const data = await res.json();
        if (data.success) {
            alert("Paystack keys saved successfully! Changes are active.");
            window.location.reload();
        } else {
            alert("Failed to save keys: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        alert("Error saving Paystack configuration.");
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
