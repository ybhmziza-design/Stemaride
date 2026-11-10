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

let userPhotoConsent = true;

function setPhotoConsent(consents) {
    userPhotoConsent = consents;
    const checkbox = document.getElementById('consent_photography');
    const yesBtn = document.getElementById('photo-consent-yes');
    const noBtn = document.getElementById('photo-consent-no');
    const nameBox = document.getElementById('photo-no-consent-name');
    const namesInput = document.getElementById('photo_no_consent_names');

    if (checkbox) checkbox.checked = consents;

    if (consents) {
        if (yesBtn) {
            yesBtn.className = 'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
        }
        if (noBtn) {
            noBtn.className = 'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-400';
        }
        if (nameBox) nameBox.classList.add('hidden');
    } else {
        if (noBtn) {
            noBtn.className = 'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition bg-amber-500/20 border-amber-500/50 text-amber-400';
        }
        if (yesBtn) {
            yesBtn.className = 'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400';
        }
        if (nameBox) {
            nameBox.classList.remove('hidden');
            setTimeout(() => { if (namesInput) namesInput.focus(); }, 100);
        }
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
        calculateTotal(700, 'Cycling Individual', 'cycling');
    } else if (category === 'skating') {
        if (promptSkating) promptSkating.classList.remove('hidden');
        if (heading) heading.innerText = "Skating Options & Equipment";
        // Reset skate option to 'own' when switching to skating
        const skateOwnRadio = document.getElementById('skate_own');
        if (skateOwnRadio) skateOwnRadio.checked = true;
        calculateTotal(700, 'Skating Individual', 'skating');
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
    const isHire = bikeHireRadio && bikeHireRadio.checked;
    calculateTotal(700, 'Cycling Individual', 'cycling', isHire);
}

function onSkateOptionChanged() {
    const skateHireRadio = document.getElementById('skate_hire');
    const isHire = skateHireRadio && skateHireRadio.checked;
    calculateTotal(700, 'Skating Individual', 'skating', isHire);
}

function calculateTotal(basePrice, label, category, forceHire) {
    const totalDisplay = document.getElementById('total_amount_display');
    const feeBreakdown = document.getElementById('fee_breakdown_label');

    let hireCost = 0;
    let hireTypeLabel = 'Equipment Rental';

    if (category === 'cycling') {
        let isHire = false;
        if (typeof forceHire !== 'undefined') {
            isHire = forceHire;
        } else {
            const bikeHireRadio = document.getElementById('bike_hire');
            isHire = bikeHireRadio && bikeHireRadio.checked;
        }
        if (isHire) {
            hireCost = 500;
            hireTypeLabel = 'Bike Rental';
        }
    } else if (category === 'skating') {
        let isHire = false;
        if (typeof forceHire !== 'undefined') {
            isHire = forceHire;
        } else {
            const skateHireRadio = document.getElementById('skate_hire');
            isHire = skateHireRadio && skateHireRadio.checked;
        }
        if (isHire) {
            hireCost = 500;
            hireTypeLabel = 'Skate Rental';
        }
    }

    const total = basePrice + hireCost;

    if (totalDisplay) {
        totalDisplay.innerText = `KSh ${total.toLocaleString()}`;
    }
    if (feeBreakdown) {
        let breakdown = `(${label}: KSh ${basePrice.toLocaleString()}`;
        if (hireCost > 0) {
            breakdown += ` + ${hireTypeLabel}: KSh 500 = KSh ${total.toLocaleString()}`;
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
// REGISTRATION SUBMISSION & INTASEND LAUNCH
// ==========================================
async function handleRegistration(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'PAY WITH INTASEND';

    // Terms & Conditions validation (Rules & Liability are mandatory)
    const consentRules = document.getElementById('consent_rules');
    const consentLiability = document.getElementById('consent_liability');

    if (!consentRules || !consentRules.checked) {
        alert("Please accept the Safety Regulations and Helmet Guidelines to proceed.");
        return;
    }
    if (!consentLiability || !consentLiability.checked) {
        alert("Please accept the Liability Waiver & Assumption of Risk to proceed with registration.");
        return;
    }

    // Photography consent check — if declined, name(s) must be provided
    let photoNames = '';
    if (!userPhotoConsent) {
        const noNamesInput = document.getElementById('photo_no_consent_names');
        photoNames = noNamesInput ? noNamesInput.value.trim() : '';
        if (!photoNames) {
            alert("Please enter the name(s) of the participant(s) who do not consent to photography.");
            if (noNamesInput) noNamesInput.focus();
            return;
        }
    }

    const selectedRadio = document.querySelector('input[name="category"]:checked');
    const selectedCategory = selectedRadio ? selectedRadio.value : 'cycling';
    const isMinorBox = document.getElementById('is_minor_checkbox');
    const isMinor = isMinorBox ? isMinorBox.checked : false;

    // Check equipment hire — driven by bike_option or skate_option radio
    const bikeHireRadio = document.getElementById('bike_hire');
    const skateHireRadio = document.getElementById('skate_hire');
    let needsHire = false;

    if (selectedCategory === 'cycling') {
        needsHire = !!(bikeHireRadio && bikeHireRadio.checked);
    } else if (selectedCategory === 'skating') {
        needsHire = !!(skateHireRadio && skateHireRadio.checked);
    }

    const hireDetails = {};
    if (needsHire) {
        if (selectedCategory === 'cycling') {
            hireDetails.hire_item = 'Bicycle Hire';
        } else if (selectedCategory === 'skating') {
            hireDetails.hire_item = 'Roller Skates Hire';
        }
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
        consent_photography: userPhotoConsent,
        photo_no_consent_names: userPhotoConsent ? '' : photoNames,
        consent_rules: consentRules.checked,
        consent_liability: consentLiability ? consentLiability.checked : false
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Setting Up Payment...`;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.success) {
            if (data.blocked) {
                showBlockedState(data.ticket_code, data.attempts);
                return;
            }
            alert(data.error || 'Registration failed. Please check inputs.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            return;
        }

        // Proceed to TinyPesa M-Pesa payment
        initiateTinyPesaPayment(data, payload);

    } catch (err) {
        alert("An error occurred while connecting to the server. Please try again.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Global active checkout state & polling interval
let currentPendingPayment = null;
let paymentPollInterval = null;

async function initiateTinyPesaPayment(regData, payload) {
    const amount = regData.amount_due;
    const ticketCode = regData.ticket_code;
    const phone = payload.phone_number;

    currentPendingPayment = {
        regData: regData,
        payload: payload,
        ticketCode: ticketCode,
        amountDue: amount,
        phone: phone
    };

    // Open STK prompt modal
    openStkModal(amount, phone, ticketCode);

    // Trigger STK Push via backend TinyPesa API
    try {
        const stkStatus = document.getElementById('stk-status-text');
        if (stkStatus) stkStatus.innerText = "Sending M-Pesa prompt to your phone...";

        const res = await fetch('/api/tinypesa/stk-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticket_code: ticketCode,
                phone_number: phone
            })
        });

        const data = await res.json();

        if (data.already_paid) {
            closeStkModal();
            unlockSuccessModal(ticketCode, data.registration || regData.registration, data.mpesa_reference);
            return;
        }

        if (data.blocked) {
            showBlockedState(ticketCode, data.attempts);
            return;
        }

        if (data.success) {
            if (stkStatus) {
                stkStatus.innerText = "Prompt sent! Enter your M-Pesa PIN on your phone...";
            }
            const attEl = document.getElementById('stk-attempts-counter');
            if (attEl && data.attempts) {
                attEl.innerText = `Attempt ${data.attempts} of 4`;
            }
        } else {
            const attEl = document.getElementById('stk-attempts-counter');
            if (attEl && data.attempts) {
                attEl.innerText = `Attempt ${data.attempts} of 4`;
            }
            if (data.blocked) {
                showBlockedState(ticketCode, data.attempts);
                return;
            }
            if (stkStatus) {
                stkStatus.innerHTML = `<span class="text-amber-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ${data.error || 'STK push failed.'}</span>`;
            }
            // Auto open manual code entry if prompt failed
            const box = document.getElementById('manual-code-box');
            if (box) box.classList.remove('hidden');
        }
    } catch (err) {
        console.warn("STK push dispatch error:", err);
    }

    // Begin real-time polling to detect payment completion immediately
    startPaymentStatusPolling(ticketCode);
}

function openStkModal(amount, phone, ticketCode, attempts) {
    const amtEl = document.getElementById('stk-modal-amount');
    const phEl = document.getElementById('stk-modal-phone');
    const tkEl = document.getElementById('stk-modal-ticket');
    const statusEl = document.getElementById('stk-status-text');
    const manualBox = document.getElementById('manual-code-box');
    const normalCont = document.getElementById('stk-normal-container');
    const blockedCont = document.getElementById('stk-blocked-container');
    const attEl = document.getElementById('stk-attempts-counter');

    if (normalCont) normalCont.classList.remove('hidden');
    if (blockedCont) blockedCont.classList.add('hidden');
    if (amtEl) amtEl.innerText = `KSh ${amount.toLocaleString()}`;
    if (phEl) phEl.innerText = phone;
    if (tkEl) tkEl.innerText = ticketCode;
    if (statusEl) statusEl.innerText = "Sending prompt to your phone...";
    if (attEl) attEl.innerText = `Attempt ${attempts || 1} of 4`;
    if (manualBox) manualBox.classList.add('hidden');

    const modal = document.getElementById('tinypesa-stk-modal');
    if (modal) modal.classList.remove('hidden');
}

function showBlockedState(ticketCode, attempts) {
    stopPaymentStatusPolling();
    const normalCont = document.getElementById('stk-normal-container');
    const blockedCont = document.getElementById('stk-blocked-container');
    const tkEl = document.getElementById('blocked-modal-ticket');
    const callBtn = document.getElementById('blocked-call-btn');
    const waBtn = document.getElementById('blocked-whatsapp-btn');

    if (normalCont) normalCont.classList.add('hidden');
    if (blockedCont) blockedCont.classList.remove('hidden');
    if (tkEl) tkEl.innerText = ticketCode || '--';

    const phone = window.SUPPORT_PHONE || '0740853389';
    if (callBtn) callBtn.href = `tel:${phone}`;
    if (waBtn) {
        const intlPhone = '254' + phone.replace(/^0/, '');
        waBtn.href = `https://wa.me/${intlPhone}?text=Hello%20STEMA%20Team%2C%20please%20unblock%20my%20ticket%20${ticketCode}%20for%20payment.`;
    }

    const modal = document.getElementById('tinypesa-stk-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeStkModal() {
    stopPaymentStatusPolling();
    const modal = document.getElementById('tinypesa-stk-modal');
    if (modal) modal.classList.add('hidden');
}

function startPaymentStatusPolling(ticketCode) {
    stopPaymentStatusPolling();
    let pollCount = 0;
    const maxPolls = 48; // ~2 minutes polling at 2.5s intervals

    paymentPollInterval = setInterval(async () => {
        pollCount++;
        try {
            const res = await fetch(`/api/payment/status/${ticketCode}`);
            const data = await res.json();

            if (data.success && data.paid) {
                stopPaymentStatusPolling();
                closeStkModal();
                unlockSuccessModal(ticketCode, data.registration, data.mpesa_reference);
                return;
            }

            if (data.blocked) {
                showBlockedState(ticketCode, data.attempts);
                return;
            }
        } catch (e) {
            console.warn("Status poll error:", e);
        }

        if (pollCount >= maxPolls) {
            stopPaymentStatusPolling();
            const statusEl = document.getElementById('stk-status-text');
            if (statusEl) {
                statusEl.innerHTML = `<span class="text-slate-400">Still waiting? Enter M-Pesa code below or resend prompt.</span>`;
            }
            const box = document.getElementById('manual-code-box');
            if (box) box.classList.remove('hidden');
        }
    }, 2500);
}

function stopPaymentStatusPolling() {
    if (paymentPollInterval) {
        clearInterval(paymentPollInterval);
        paymentPollInterval = null;
    }
}

function toggleManualCodeBox() {
    const box = document.getElementById('manual-code-box');
    const icon = document.getElementById('manual-toggle-icon');
    if (box) {
        box.classList.toggle('hidden');
        if (icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    }
}

async function submitManualMpesaCode() {
    if (!currentPendingPayment) return;
    const codeInput = document.getElementById('manual-mpesa-code');
    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    const btn = document.getElementById('manual-confirm-btn');

    if (!code || code.length < 5) {
        alert("Please enter a valid M-Pesa reference code (e.g. QWE123RTY).");
        return;
    }

    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i>`;
    }

    try {
        const res = await fetch('/api/payment/manual-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticket_code: currentPendingPayment.ticketCode,
                mpesa_reference: code
            })
        });

        const data = await res.json();
        if (data.success) {
            if (data.verified) {
                closeStkModal();
                unlockSuccessModal(currentPendingPayment.ticketCode, data.registration, code);
            } else {
                alert(data.message || "Code submitted! Awaiting verification.");
                const statusEl = document.getElementById('stk-status-text');
                if (statusEl) {
                    statusEl.innerText = `Code ${code} submitted. Awaiting verification...`;
                }
            }
        } else {
            alert(data.error || "Could not confirm payment with this reference.");
        }
    } catch (err) {
        alert("Network error confirming payment. Please check your connection.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

async function resendStkPush() {
    if (!currentPendingPayment) return;
    const btn = document.getElementById('stk-resend-btn');
    const statusEl = document.getElementById('stk-status-text');
    const originalText = btn ? btn.innerHTML : '';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Resending...`;
    }
    if (statusEl) statusEl.innerText = "Resending M-Pesa STK prompt...";

    try {
        const res = await fetch('/api/tinypesa/stk-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticket_code: currentPendingPayment.ticketCode,
                phone_number: currentPendingPayment.phone
            })
        });
        const data = await res.json();
        const attEl = document.getElementById('stk-attempts-counter');
        if (attEl && data.attempts) {
            attEl.innerText = data.attempts >= 4 ? 'Attempt 4 of 4 (Final Attempt)' : `Attempt ${data.attempts} of 4`;
        }

        if (data.blocked) {
            showBlockedState(currentPendingPayment.ticketCode, data.attempts);
            return;
        }

        if (data.attempts >= 4 && btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-lock mr-1"></i> 4 of 4 Prompts Sent`;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        if (data.success) {
            if (statusEl) statusEl.innerText = data.attempts >= 4 ? "Final prompt sent! Please enter your PIN on your phone." : "New prompt sent! Check your phone and enter your PIN.";
        } else {
            if (statusEl) statusEl.innerHTML = `<span class="text-rose-400">${data.error || 'Resend failed.'}</span>`;
        }
    } catch (e) {
        if (statusEl) statusEl.innerText = "Error resending prompt. Please use code verification.";
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// ==========================================
// UNLOCK TICKET & SHOW CELEBRATION MODAL
// ==========================================
function unlockSuccessModal(ticketCode, registration, mpesaReference) {
    // Trigger celebratory Confetti!
    if (window.confetti) {
        confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.6 }
        });
    }

    const reg = registration || {};
    const tCode = ticketCode || reg.ticket_code || '--';
    
    const tkEl = document.getElementById('modal-ticket-code');
    const nameEl = document.getElementById('modal-participant-name');
    const catEl = document.getElementById('modal-category');
    const amtEl = document.getElementById('modal-amount');
    const refEl = document.getElementById('modal-intasend-ref');

    if (tkEl) tkEl.innerText = tCode;
    if (nameEl) nameEl.innerText = reg.full_name || '--';
    if (catEl) catEl.innerText = reg.category_label || '--';
    if (amtEl) amtEl.innerText = `KSh ${(reg.amount_due || 0).toLocaleString()}`;
    if (refEl) refEl.innerText = mpesaReference || reg.mpesa_reference || reg.tinypesa_reference || '--';

    // Instant Download & Pass Links
    const dlBtn = document.getElementById('modal-download-ticket-btn');
    const vwBtn = document.getElementById('modal-view-ticket-btn');
    if (dlBtn) dlBtn.href = `/ticket/${tCode}?download=1`;
    if (vwBtn) vwBtn.href = `/ticket/${tCode}`;

    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('hidden');

    // Reset registration form
    const form = document.getElementById('registration-form');
    if (form) form.reset();
    if (typeof onCategoryChanged === 'function') onCategoryChanged();
}

async function verifyAndUnlockTicket(reference, ticketCode, mpesaReference) {
    try {
        const res = await fetch('/api/intasend/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                tracking_id: reference, 
                ticket_code: ticketCode,
                mpesa_reference: mpesaReference || ''
            })
        });
        const data = await res.json();

        if (!data.success) {
            alert(data.error || 'Payment verification failed.');
            return;
        }

        unlockSuccessModal(data.ticket_code, data.registration, data.reference);
    } catch (e) {
        alert("Payment received! Reference code: " + reference + ". Your ticket code is " + ticketCode);
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


// ===== PHOTO GALLERY — Dynamic (Cloudflare R2 / local fallback) =====
let galleryImages = [];   // populated from /api/gallery/photos
let currentPhotoIdx = 0;

async function loadGallery() {
    const grid      = document.getElementById('gallery-grid');
    const loading   = document.getElementById('gallery-loading');
    const empty     = document.getElementById('gallery-empty');
    const countBar  = document.getElementById('gallery-count-bar');
    if (!grid) return;

    try {
        const res  = await fetch('/api/gallery/photos');
        const data = await res.json();

        if (loading) loading.style.display = 'none';

        if (!data.success || !data.photos || data.photos.length === 0) {
            if (empty) empty.classList.remove('hidden');
            return;
        }

        galleryImages = data.photos;   // [{url, caption, key, source}, …]

        grid.innerHTML = '';
        grid.style.display = '';

        galleryImages.forEach((photo, idx) => {
            // Make last odd photo span 2 columns for a nicer layout
            const isWide = (galleryImages.length % 2 !== 0) && (idx === galleryImages.length - 1);
            const card = document.createElement('div');
            card.className = `relative group overflow-hidden rounded-2xl cursor-pointer${isWide ? ' sm:col-span-2 lg:col-span-2' : ''}`;
            card.onclick = () => openLightbox(idx);
            card.innerHTML = `
                <img src="${photo.url}" alt="${photo.caption}" loading="lazy"
                     class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                     onerror="this.closest('.relative').style.display='none'">
                <div class="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition rounded-2xl"></div>
                <div class="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] text-white font-semibold">${photo.caption}</div>
            `;
            grid.appendChild(card);
        });

        if (countBar) {
            const src = data.source === 'r2' ? '☁️ Cloudflare R2' : '📁 Local storage';
            countBar.innerHTML = `<p class="text-slate-500 text-xs">${src} · ${galleryImages.length} photo${galleryImages.length !== 1 ? 's' : ''}</p>`;
        }
    } catch (err) {
        if (loading) loading.style.display = 'none';
        if (empty) empty.classList.remove('hidden');
        console.error('Gallery load error:', err);
    }
}

function openLightbox(idx) {
    currentPhotoIdx = idx;
    updateLightbox();
    const lb = document.getElementById('lightbox');
    if (lb) { lb.classList.remove('hidden'); lb.classList.add('flex'); }
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) { lb.classList.add('hidden'); lb.classList.remove('flex'); }
    document.body.style.overflow = '';
}

function prevPhoto(e) {
    e.stopPropagation();
    if (!galleryImages.length) return;
    currentPhotoIdx = (currentPhotoIdx - 1 + galleryImages.length) % galleryImages.length;
    updateLightbox();
}

function nextPhoto(e) {
    e.stopPropagation();
    if (!galleryImages.length) return;
    currentPhotoIdx = (currentPhotoIdx + 1) % galleryImages.length;
    updateLightbox();
}

function updateLightbox() {
    const img     = document.getElementById('lightbox-img');
    const counter = document.getElementById('lightbox-counter');
    const photo   = galleryImages[currentPhotoIdx];
    if (img && photo) { img.src = photo.url; img.alt = photo.caption; }
    if (counter)      { counter.textContent = `${currentPhotoIdx + 1} / ${galleryImages.length}`; }
}

// Close lightbox on Escape / Arrow keys
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')  { const lb = document.getElementById('lightbox'); if (lb && !lb.classList.contains('hidden')) prevPhoto(e); }
    if (e.key === 'ArrowRight') { const lb = document.getElementById('lightbox'); if (lb && !lb.classList.contains('hidden')) nextPhoto(e); }
});

// Load gallery on page ready
document.addEventListener('DOMContentLoaded', loadGallery);
