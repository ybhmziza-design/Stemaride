// Main JavaScript for THE RIDE 2026

document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    onCategoryChanged();
});

// ==========================================
// COUNTDOWN TIMER TO 21ST NOVEMBER 2026
// ==========================================
function initCountdown() {
    const eventDate = new Date('November 21, 2026 07:00:00').getTime();

    function update() {
        const now = new Date().getTime();
        const distance = eventDate - now;

        if (distance <= 0) {
            document.getElementById('countdown').innerHTML = "<div class='col-span-4 text-center font-bold text-yellow-400'>Event Day is Here! Welcome to THE RIDE!</div>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const dEl = document.getElementById('cd-days');
        const hEl = document.getElementById('cd-hours');
        const mEl = document.getElementById('cd-mins');
        const sEl = document.getElementById('cd-secs');

        if (dEl) dEl.innerText = days;
        if (hEl) hEl.innerText = hours;
        if (mEl) mEl.innerText = minutes;
        if (sEl) sEl.innerText = seconds;
    }

    update();
    setInterval(update, 1000);
}

// ==========================================
// POSTER MODAL
// ==========================================
function openPosterModal() {
    const modal = document.getElementById('poster-modal');
    if (modal) modal.classList.remove('hidden');
}

function closePosterModal() {
    const modal = document.getElementById('poster-modal');
    if (modal) modal.classList.add('hidden');
}

// ==========================================
// CATEGORY SELECTION & DYNAMIC PROMPTS
// ==========================================
function selectCategory(category) {
    const radio = document.querySelector(`input[name="category"][value="${category}"]`);
    if (radio) {
        radio.checked = true;
        onCategoryChanged();
    }
    const formSection = document.getElementById('register');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function onCategoryChanged() {
    const selectedRadio = document.querySelector('input[name="category"]:checked');
    if (!selectedRadio) return;
    const category = selectedRadio.value;

    const promptCycling = document.getElementById('prompt-cycling');
    const promptSkating = document.getElementById('prompt-skating');
    const promptGroup = document.getElementById('prompt-group-of-3');
    const promptWalking = document.getElementById('prompt-walking');
    const heading = document.getElementById('prompt-heading');

    // Hide all prompts first
    if (promptCycling) promptCycling.classList.add('hidden');
    if (promptSkating) promptSkating.classList.add('hidden');
    if (promptGroup) promptGroup.classList.add('hidden');
    if (promptWalking) promptWalking.classList.add('hidden');

    if (category === 'cycling') {
        if (promptCycling) promptCycling.classList.remove('hidden');
        if (heading) heading.innerText = "Cycling Route & Distance Options";
        // Reset bike option to 'own' when switching to cycling
        const bikeOwnRadio = document.getElementById('bike_own');
        if (bikeOwnRadio) bikeOwnRadio.checked = true;
        const hireDetails = document.getElementById('bicycle_hire_details');
        if (hireDetails) hireDetails.classList.add('hidden');
        calculateTotal(700, 'Cycling Individual', 'cycling');
    } else if (category === 'skating') {
        if (promptSkating) promptSkating.classList.remove('hidden');
        if (heading) heading.innerText = "Skating Options";
        calculateTotal(500, 'Skating', 'skating');
    } else if (category === 'group_of_3') {
        if (promptGroup) promptGroup.classList.remove('hidden');
        if (heading) heading.innerText = "Group of 3 Participants Registration";
        calculateTotal(1500, 'Group of 3 (Squad)', 'group_of_3');
    } else if (category === 'walking') {
        if (promptWalking) promptWalking.classList.remove('hidden');
        if (heading) heading.innerText = "Walking Route & Pace Preferences";
        calculateTotal(500, 'Walking Category', 'walking');
    }
}

function onBikeOptionChanged() {
    const bikeHireRadio = document.getElementById('bike_hire');
    const hireDetails = document.getElementById('bicycle_hire_details');
    const isHire = bikeHireRadio && bikeHireRadio.checked;

    if (hireDetails) {
        if (isHire) {
            hireDetails.classList.remove('hidden');
        } else {
            hireDetails.classList.add('hidden');
        }
    }

    // Update price
    if (isHire) {
        calculateTotal(700, 'Cycling Individual', 'cycling', true);
    } else {
        calculateTotal(700, 'Cycling Individual', 'cycling', false);
    }
}

function calculateTotal(basePrice, label, category, forceHire) {
    const totalDisplay = document.getElementById('total_amount_display');
    const feeBreakdown = document.getElementById('fee_breakdown_label');

    let hireCost = 0;
    if (category === 'cycling') {
        // Check if forceHire was explicitly passed; otherwise read the radio
        let isHire = false;
        if (typeof forceHire !== 'undefined') {
            isHire = forceHire;
        } else {
            const bikeHireRadio = document.getElementById('bike_hire');
            isHire = bikeHireRadio && bikeHireRadio.checked;
        }
        if (isHire) hireCost = 500;
    }

    const total = basePrice + hireCost;

    if (totalDisplay) {
        totalDisplay.innerText = `KSh ${total.toLocaleString()}`;
    }
    if (feeBreakdown) {
        let breakdown = `(${label}: KSh ${basePrice.toLocaleString()}`;
        if (hireCost > 0) {
            breakdown += ` + Bike Rental: KSh 500 = KSh ${total.toLocaleString()}`;
        }
        breakdown += `)`;
        feeBreakdown.innerText = breakdown;
    }
}


function toggleMinorFields(isMinor) {
    const fields = document.getElementById('minor_guardian_fields');
    const parentName = document.getElementById('parent_name');
    const parentPhone = document.getElementById('parent_phone');
    if (fields) {
        if (isMinor) {
            fields.classList.remove('hidden');
            if (parentName) parentName.setAttribute('required', 'required');
            if (parentPhone) parentPhone.setAttribute('required', 'required');
        } else {
            fields.classList.add('hidden');
            if (parentName) parentName.removeAttribute('required');
            if (parentPhone) parentPhone.removeAttribute('required');
        }
    }
}

// ==========================================
// REGISTRATION SUBMISSION & PAYSTACK LAUNCH
// ==========================================
async function handleRegistration(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'PAY WITH PAYSTACK';

    // Consent validation
    const consentPhoto = document.getElementById('consent_photography');
    const consentRules = document.getElementById('consent_rules');

    if (!consentPhoto || !consentPhoto.checked || !consentRules || !consentRules.checked) {
        alert("Please accept both the Photography Consent policy and Safety Regulations to proceed.");
        return;
    }

    const selectedRadio = document.querySelector('input[name="category"]:checked');
    const selectedCategory = selectedRadio ? selectedRadio.value : 'cycling';
    const isMinorBox = document.getElementById('is_minor_checkbox');
    const isMinor = isMinorBox ? isMinorBox.checked : false;

    // Check equipment hire — now driven by bike_option radio (cycling only)
    const bikeHireRadio = document.getElementById('bike_hire');
    const needsHire = selectedCategory === 'cycling' && bikeHireRadio && bikeHireRadio.checked;

    const hireDetails = {};
    if (needsHire) {
        const itemEl = document.getElementById('hire_item_type');
        const sizeEl = document.getElementById('hire_shoe_size');
        const kitEl = document.getElementById('hire_safety_kit');
        hireDetails.hire_item = itemEl ? itemEl.value : (selectedCategory === 'skating' ? 'Roller Skates' : 'Bicycle');
        hireDetails.size = sizeEl && sizeEl.value.trim() ? sizeEl.value.trim() : 'Standard';
        hireDetails.safety_kit = kitEl ? kitEl.value : 'Helmet Included';
    }

    // Prepare category details
    const categoryDetails = {};
    if (selectedCategory === 'cycling') {
        const distEl = document.getElementById('cycling_distance');
        if (distEl) categoryDetails.distance = distEl.value;
    } else if (selectedCategory === 'skating') {
        const distEl = document.getElementById('skating_distance');
        const gearEl = document.getElementById('skating_gear_type');
        if (distEl) categoryDetails.distance = distEl.value;
        if (gearEl) categoryDetails.gear_type = gearEl.value;
    } else if (selectedCategory === 'group_of_3') {
        const teamEl = document.getElementById('group_team_name');
        const modeEl = document.getElementById('group_activity_mode');
        if (teamEl) categoryDetails.team_name = teamEl.value;
        if (modeEl) categoryDetails.activity_mode = modeEl.value;
    } else if (selectedCategory === 'walking') {
        const distEl = document.getElementById('walking_distance');
        const paceEl = document.getElementById('walking_pace');
        if (distEl) categoryDetails.distance = distEl.value;
        if (paceEl) categoryDetails.pace = paceEl.value;
    }

    // Group members if applicable
    const groupMembers = [];
    if (selectedCategory === 'group_of_3') {
        const m2NameEl = document.getElementById('group_member_2_name');
        const m2PhoneEl = document.getElementById('group_member_2_phone');
        const m3NameEl = document.getElementById('group_member_3_name');
        const m3PhoneEl = document.getElementById('group_member_3_phone');

        const m2Name = m2NameEl ? m2NameEl.value.trim() : '';
        const m2Phone = m2PhoneEl ? m2PhoneEl.value.trim() : '';
        const m3Name = m3NameEl ? m3NameEl.value.trim() : '';
        const m3Phone = m3PhoneEl ? m3PhoneEl.value.trim() : '';

        if (m2Name) groupMembers.push({ name: m2Name, phone: m2Phone });
        if (m3Name) groupMembers.push({ name: m3Name, phone: m3Phone });
    }

    const fullNameEl = document.getElementById('full_name');
    const phoneEl = document.getElementById('phone_number');
    const emailEl = document.getElementById('email');
    const emergencyEl = document.getElementById('emergency_contact');
    const parentNameEl = document.getElementById('parent_name');
    const parentPhoneEl = document.getElementById('parent_phone');

    const payload = {
        full_name: fullNameEl ? fullNameEl.value.trim() : '',
        phone_number: phoneEl ? phoneEl.value.trim() : '',
        email: emailEl ? emailEl.value.trim() : '',
        category: selectedCategory,
        needs_hire: needsHire,
        hire_details: hireDetails,
        category_details: categoryDetails,
        group_members: groupMembers,
        is_minor: isMinor,
        parent_name: (isMinor && parentNameEl) ? parentNameEl.value.trim() : '',
        parent_phone: (isMinor && parentPhoneEl) ? parentPhoneEl.value.trim() : '',
        emergency_contact: emergencyEl ? emergencyEl.value.trim() : '',
        consent_photography: consentPhoto.checked,
        consent_rules: consentRules.checked
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Initializing Paystack Checkout...`;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.error || 'Registration failed. Please check inputs.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            return;
        }

        // Proceed directly to Paystack payment
        initiatePaystackPayment(data, payload);

    } catch (err) {
        alert("An error occurred while connecting to server. Please try again.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Global active checkout state
let currentPendingPayment = null;

function initiatePaystackPayment(regData, payload) {
    const pubKey = regData.paystack_public_key;
    const email = payload.email || `${payload.phone_number.replace(/\D/g, '')}@stemaride.ke`;
    const amountKobo = regData.amount_kobo;
    const ticketCode = regData.ticket_code;

    currentPendingPayment = {
        regData: regData,
        payload: payload,
        ticketCode: ticketCode,
        amountDue: regData.amount_due
    };

    if (typeof PaystackPop === 'undefined') {
        alert("Payment gateway is still loading. Please check your internet connection and try clicking Pay again in a moment.");
        return;
    }

    try {
        const handler = PaystackPop.setup({
            key: pubKey,
            email: email,
            amount: amountKobo,
            currency: 'KES',
            ref: `STM-${ticketCode}-${Date.now().toString().slice(-4)}`,
            channels: ['card', 'mobile_money', 'bank'],
            metadata: {
                custom_fields: [
                    { display_name: "Participant Name", variable_name: "participant_name", value: payload.full_name },
                    { display_name: "Phone Number", variable_name: "phone_number", value: payload.phone_number },
                    { display_name: "Ticket Code", variable_name: "ticket_code", value: ticketCode }
                ]
            },
            callback: function(response) {
                verifyAndUnlockTicket(response.reference, ticketCode);
            },
            onClose: function() {
                // Closed by participant
            }
        });
        handler.openIframe();
    } catch (e) {
        console.warn("Paystack setup fallback:", e);
        try {
            const paystack = new PaystackPop();
            paystack.newTransaction({
                key: pubKey,
                email: email,
                amount: amountKobo,
                currency: 'KES',
                reference: `STM-${ticketCode}-${Date.now().toString().slice(-4)}`,
                onSuccess: function(transaction) {
                    verifyAndUnlockTicket(transaction.reference, ticketCode);
                },
                onCancel: function() {
                    // cancelled
                }
            });
        } catch (err2) {
            alert("Error launching Paystack: " + (e.message || err2.message));
        }
    }
}

async function confirmSimulatedPayment() {
    if (!currentPendingPayment) return;
    const simBtn = document.getElementById('sim-confirm-btn');
    simBtn.disabled = true;
    simBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Authorizing...`;

    const simRef = `PSTK-TEST-${Date.now().toString().slice(-6)}`;
    await verifyAndUnlockTicket(simRef, currentPendingPayment.ticketCode);

    simBtn.disabled = false;
    simBtn.innerHTML = `<i class="fa-solid fa-check-circle mr-1"></i> Authorize & Complete Payment`;
    closeSimModal();
}

function closeSimModal() {
    document.getElementById('paystack-sim-modal').classList.add('hidden');
}

// ==========================================
// VERIFY PAYMENT & INSTANT TICKET ISSUANCE
// ==========================================
async function verifyAndUnlockTicket(reference, ticketCode) {
    try {
        const res = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: reference, ticket_code: ticketCode })
        });
        const data = await res.json();

        if (!data.success) {
            alert(data.error || 'Payment verification failed.');
            return;
        }

        // Trigger celebratory Confetti!
        if (window.confetti) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 }
            });
        }

        // Update and show Instant Ticket Download Modal
        document.getElementById('modal-ticket-code').innerText = data.ticket_code;
        document.getElementById('modal-participant-name').innerText = data.registration.full_name;
        document.getElementById('modal-category').innerText = data.registration.category_label;
        document.getElementById('modal-amount').innerText = `KSh ${data.registration.amount_due.toLocaleString()}`;
        document.getElementById('modal-paystack-ref').innerText = data.reference;

        // Instant Download & Pass Links
        document.getElementById('modal-download-ticket-btn').href = `/ticket/${data.ticket_code}?download=1`;
        document.getElementById('modal-view-ticket-btn').href = `/ticket/${data.ticket_code}`;

        document.getElementById('success-modal').classList.remove('hidden');

        // Reset registration form
        document.getElementById('registration-form').reset();
        onCategoryChanged();

    } catch (e) {
        alert("Error verifying payment with server. Your reference code is: " + reference);
    }
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
}

// ==========================================
// ANTI-MIXUP LOOKUP: Search by Phone / Ticket
// ==========================================
async function handleSearchRegistration(e) {
    e.preventDefault();
    const query = document.getElementById('search_query').value.trim();
    if (!query) return;

    const area = document.getElementById('search-results-area');
    const list = document.getElementById('search-results-list');

    area.classList.remove('hidden');
    list.innerHTML = `<div class="p-6 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Searching registration database for '${query}'...</div>`;

    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data.success || data.results.length === 0) {
            list.innerHTML = `
                <div class="p-6 bg-slate-950 rounded-2xl border border-red-500/30 text-center space-y-3">
                    <div class="text-red-400 text-3xl"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div class="font-bold text-white text-base">No Registration Found</div>
                    <p class="text-xs text-slate-400">
                        We could not find any record matching <strong>${query}</strong>. Please check your phone number or register using the form above.
                    </p>
                </div>
            `;
            return;
        }

        let html = '';
        data.results.forEach(reg => {
            const statusClass = reg.checked_in 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            const statusText = reg.checked_in ? 'Checked In' : 'Confirmed Registration';

            let groupBadge = '';
            if (reg.category === 'group_of_3' && reg.group_members && reg.group_members.length) {
                const membersStr = reg.group_members.map(m => m.name).join(', ');
                groupBadge = `<div class="text-xs text-sky-400 mt-1"><i class="fa-solid fa-users mr-1"></i> Team: ${reg.full_name}, ${membersStr}</div>`;
            }

            let hireBadge = '';
            if (reg.needs_hire && reg.hire_details) {
                hireBadge = `<div class="text-xs text-orange-400 mt-1"><i class="fa-solid fa-screwdriver-wrench mr-1"></i> Hired: ${reg.hire_details.hire_item || 'Gear'} (${reg.hire_details.size || ''})</div>`;
            }

            html += `
                <div class="p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-yellow-400/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-black text-yellow-400 text-sm tracking-wider">${reg.ticket_code}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusClass}">${statusText}</span>
                        </div>
                        <h4 class="font-bold text-white text-base">${reg.full_name}</h4>
                        <div class="text-xs text-slate-400">
                            <span><i class="fa-solid fa-phone mr-1"></i>${reg.phone_number}</span>
                            <span class="mx-2">•</span>
                            <span><i class="fa-solid fa-layer-group mr-1"></i>${reg.category_label}</span>
                            <span class="mx-2">•</span>
                            <span class="text-yellow-400 font-bold">KSh ${reg.amount_due}</span>
                        </div>
                        ${groupBadge}
                        ${hireBadge}
                    </div>

                    <div class="flex items-center gap-2 sm:self-center">
                        <a href="/ticket/${reg.ticket_code}" class="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition">
                            <i class="fa-solid fa-ticket"></i>
                            <span>View Ticket</span>
                        </a>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;

    } catch (e) {
        list.innerHTML = `<div class="p-4 text-center text-red-400 text-xs">Error connecting to server. Please try again.</div>`;
    }
}
