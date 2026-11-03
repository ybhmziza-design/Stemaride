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
    const promptGroup = document.getElementById('prompt-group-of-3');
    const promptWalking = document.getElementById('prompt-walking');
    const hireAddonContainer = document.getElementById('prompt-hire-details');
    const heading = document.getElementById('prompt-heading');

    // Hide all first
    promptCycling.classList.add('hidden');
    promptGroup.classList.add('hidden');
    promptWalking.classList.add('hidden');

    // Default rates
    let basePrice = 700;
    let label = "Cycling (Individual)";

    if (category === 'cycling') {
        promptCycling.classList.remove('hidden');
        heading.innerText = "Cycling Route & Gear Options";
        basePrice = 700;
        label = "Cycling Individual";
        hireAddonContainer.classList.remove('hidden');
    } else if (category === 'group_of_3') {
        promptGroup.classList.remove('hidden');
        heading.innerText = "Group of 3 Participants Registration";
        basePrice = 1500;
        label = "Group of 3 (Team)";
        hireAddonContainer.classList.remove('hidden');
    } else if (category === 'walking') {
        promptWalking.classList.remove('hidden');
        heading.innerText = "Walking Route & Pace Preferences";
        basePrice = 500;
        label = "Walking Category";
        hireAddonContainer.classList.remove('hidden');
    } else if (category === 'hire_only') {
        heading.innerText = "Equipment Hire Specifications";
        basePrice = 500;
        label = "Gear Hire for the Day";
        // When hire_only is chosen, force hire to be true
        const hireCheck = document.getElementById('checkbox_needs_hire');
        if (hireCheck) hireCheck.checked = true;
        toggleHireAddon(true);
        hireAddonContainer.classList.remove('hidden');
    }

    calculateTotal(basePrice, label, category);
}

function checkCyclingGearOption(val) {
    const hireCheck = document.getElementById('checkbox_needs_hire');
    if (val === 'need_hire') {
        hireCheck.checked = true;
        toggleHireAddon(true);
    } else {
        hireCheck.checked = false;
        toggleHireAddon(false);
    }
}

function toggleHireAddon(isChecked) {
    const dropdowns = document.getElementById('hire_options_dropdowns');
    if (dropdowns) {
        if (isChecked) {
            dropdowns.classList.remove('hidden');
        } else {
            dropdowns.classList.add('hidden');
        }
    }
    // Re-calculate
    const selectedRadio = document.querySelector('input[name="category"]:checked');
    const cat = selectedRadio ? selectedRadio.value : 'cycling';
    let base = (cat === 'group_of_3') ? 1500 : ((cat === 'walking' || cat === 'hire_only') ? 500 : 700);
    calculateTotal(base, cat.replace('_', ' ').toUpperCase(), cat);
}

function handleHireTypeChange(val) {
    const shoeBox = document.getElementById('skate_shoe_size_box');
    if (shoeBox) {
        if (val === 'Roller Skates') {
            shoeBox.querySelector('label').innerText = 'Shoe / Skate Size (EU)';
        } else {
            shoeBox.querySelector('label').innerText = 'Bike Frame / Rider Height';
        }
    }
}

function toggleMinorFields(isMinor) {
    const fields = document.getElementById('minor_guardian_fields');
    const parentName = document.getElementById('parent_name');
    const parentPhone = document.getElementById('parent_phone');
    if (isMinor) {
        fields.classList.remove('hidden');
        parentName.setAttribute('required', 'required');
        parentPhone.setAttribute('required', 'required');
    } else {
        fields.classList.add('hidden');
        parentName.removeAttribute('required');
        parentPhone.removeAttribute('required');
    }
}

function calculateTotal(basePrice, label, category) {
    const hireCheck = document.getElementById('checkbox_needs_hire');
    let hireCost = 0;
    
    // If category is already 'hire_only', basePrice is already 500
    if (category !== 'hire_only' && hireCheck && hireCheck.checked) {
        hireCost = 500;
    }

    const total = basePrice + hireCost;
    document.getElementById('total_amount_display').innerText = `KSh ${total.toLocaleString()}`;

    let breakdown = `(${label}: KSh ${basePrice}`;
    if (hireCost > 0) {
        breakdown += ` + Equipment Hire: KSh 500`;
    }
    breakdown += `)`;
    document.getElementById('fee_breakdown_label').innerText = breakdown;
}

// ==========================================
// REGISTRATION SUBMISSION
// ==========================================
async function handleRegistration(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    // Consent validation
    const consentPhoto = document.getElementById('consent_photography').checked;
    const consentRules = document.getElementById('consent_rules').checked;

    if (!consentPhoto || !consentRules) {
        alert("Please accept both the Photography Consent policy and Safety Regulations to proceed.");
        return;
    }

    const selectedCategory = document.querySelector('input[name="category"]:checked').value;
    const isMinor = document.getElementById('is_minor_checkbox').checked;
    const needsHire = document.getElementById('checkbox_needs_hire').checked;

    // Prepare category details
    const categoryDetails = {};
    if (selectedCategory === 'cycling') {
        categoryDetails.distance = document.getElementById('cycling_distance').value;
        categoryDetails.bike_arrangement = document.getElementById('cycling_bike_type').value;
    } else if (selectedCategory === 'group_of_3') {
        categoryDetails.team_name = document.getElementById('group_team_name').value;
        categoryDetails.activity_mode = document.getElementById('group_activity_mode').value;
    } else if (selectedCategory === 'walking') {
        categoryDetails.distance = document.getElementById('walking_distance').value;
        categoryDetails.pace = document.getElementById('walking_pace').value;
    }

    // Group members if applicable
    const groupMembers = [];
    if (selectedCategory === 'group_of_3') {
        const m2Name = document.getElementById('group_member_2_name').value.trim();
        const m2Phone = document.getElementById('group_member_2_phone').value.trim();
        const m3Name = document.getElementById('group_member_3_name').value.trim();
        const m3Phone = document.getElementById('group_member_3_phone').value.trim();

        if (m2Name) groupMembers.push({ name: m2Name, phone: m2Phone });
        if (m3Name) groupMembers.push({ name: m3Name, phone: m3Phone });
    }

    // Hire details
    const hireDetails = {};
    if (needsHire || selectedCategory === 'hire_only') {
        hireDetails.hire_item = document.getElementById('hire_item_type').value;
        hireDetails.size = document.getElementById('hire_shoe_size').value;
        hireDetails.safety_kit = document.getElementById('hire_safety_kit').value;
    }

    const payload = {
        full_name: document.getElementById('full_name').value.trim(),
        phone_number: document.getElementById('phone_number').value.trim(),
        email: document.getElementById('email').value.trim(),
        category: selectedCategory,
        needs_hire: needsHire || selectedCategory === 'hire_only',
        category_details: categoryDetails,
        group_members: groupMembers,
        hire_details: hireDetails,
        is_minor: isMinor,
        parent_name: isMinor ? document.getElementById('parent_name').value.trim() : '',
        parent_phone: isMinor ? document.getElementById('parent_phone').value.trim() : '',
        emergency_contact: document.getElementById('emergency_contact').value.trim(),
        consent_photography: consentPhoto,
        consent_rules: consentRules
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Initializing Paystack Checkout...`;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.error || 'Registration failed. Please check inputs.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        // Proceed to Paystack payment
        initiatePaystackPayment(data, payload);

    } catch (err) {
        alert("An error occurred while connecting to server. Please try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Global active checkout state
let currentPendingPayment = null;

function initiatePaystackPayment(regData, payload) {
    const pubKey = regData.paystack_public_key || 'pk_test_sample_stemaride';
    const email = payload.email || `${payload.phone_number.replace(/\D/g, '')}@stemaride.ke`;
    const amountKobo = regData.amount_kobo;
    const ticketCode = regData.ticket_code;

    currentPendingPayment = {
        regData: regData,
        payload: payload,
        ticketCode: ticketCode,
        amountDue: regData.amount_due
    };

    // If real Paystack key is present and PaystackPop is loaded
    if (window.PaystackPop && pubKey && !pubKey.includes('sample_stemaride')) {
        try {
            const handler = PaystackPop.setup({
                key: pubKey,
                email: email,
                amount: amountKobo,
                currency: 'KES',
                ref: `TR26-${ticketCode}-${Date.now().toString().slice(-4)}`,
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
                    alert("Paystack payment cancelled. Your ticket reference is " + ticketCode + ". You can pay and verify anytime.");
                }
            });
            handler.openIframe();
            return;
        } catch (e) {
            console.warn("Paystack inline launch error, falling back to simulator:", e);
        }
    }

    // If Paystack cannot be initialized, show an error and halt the flow.
    alert('Unable to load Paystack payment gateway. Please try again later.');
    // Do not proceed with simulated payment; registration will remain pending.
    return;
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
