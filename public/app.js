// Core App State
let currentWorker = null;
let mapInstance = null;
let currentMarker = null;
let ilcsChartInstance = null;
let autoPingInterval = null;
let pingCount = 0;

// Element References
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const termOutput = document.getElementById('terminalOutput');
const claimTermOutput = document.getElementById('claimResultTerminal');

// --- AUTH & INIT ---
async function register() {
    const workerId = document.getElementById('workerId').value;
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const jobType = document.getElementById('jobType').value;
    const zoneId = document.getElementById('zoneId').value;

    if(!workerId || !name || !phone || !jobType || !zoneId) return alert("Please fill all fields");

    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({workerId, name, phone, jobType, zoneId})
        });
        const data = await res.json();
        
        if (data.user) {
            currentWorker = data.user;
            initDashboard();
        } else {
            alert("Login failed. Check your connection.");
        }
    } catch(e) {
        console.error(e);
        alert("Server is fully offline currently.");
    } finally {
        btn.innerHTML = 'Register / Login <i class="fa-solid fa-arrow-right ml-2"></i>';
        btn.disabled = false;
    }
}

async function initDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');

    document.getElementById('sidebarName').innerText = currentWorker.name;
    document.getElementById('sidebarId').innerText = currentWorker.workerId;
    document.getElementById('welcomeName').innerText = currentWorker.name.split(" ")[0];
    
    updateOverviewPanel();
    
    // Initial Plan Highlight based on Risk Level assigned
    if(currentWorker.riskLevel === 'Low') highlightPlan(0);
    else if(currentWorker.riskLevel === 'Medium') highlightPlan(1);
    else highlightPlan(2);

    fetchEnvironmentData();
    switchTab('overview');
}

function updateOverviewPanel() {
    document.getElementById('overviewWallet').innerText = currentWorker.walletBalance;
    document.getElementById('overviewPremium').innerText = currentWorker.premiumPlan;
    
    // For Dashboard Risk Box styling
    const riskBadge = document.getElementById('overviewRisk');
    riskBadge.innerText = currentWorker.riskLevel + " Risk";
    if(currentWorker.riskLevel === 'Low') {
        riskBadge.className = 'text-green';
    }
    else if(currentWorker.riskLevel === 'Medium') {
        riskBadge.className = 'text-orange';
    }
    else {
        riskBadge.className = 'text-red';
    }

    // Fetch and display active dynamic policy
    fetch(`/api/policy/${currentWorker.workerId}`)
        .then(r => r.json())
        .then(policy => {
            if(policy && policy.policyId) {
                document.getElementById('overviewPremium').innerText = policy.weeklyPremium;
                document.getElementById('policyIdVal').innerText = policy.policyId;
                document.getElementById('policyTypeVal').innerText = policy.coverageType;
                document.getElementById('policyStatusVal').innerText = policy.status;
                
                // Checkout Panel bindings Phase 3:
                document.getElementById('checkoutWalletBalance').innerText = currentWorker.walletBalance;
                document.getElementById('billPlanCost').innerText = `₹ ${policy.weeklyPremium}`;
                document.getElementById('billTotalCost').innerText = `₹ ${policy.weeklyPremium}`; // Mock 0 taxes

                // Activation Button Logic Phase 3
                const actBtn = document.getElementById('activatePolicyBtn');
                const checkoutBtn = document.getElementById('payNowBtnCheckout');
                const warn = document.getElementById('lowBalanceWarning');

                if (policy.status === 'Pending Payment') {
                    actBtn.classList.remove('hidden');
                    if(currentWorker.walletBalance < policy.weeklyPremium) {
                        warn.classList.remove('hidden');
                        checkoutBtn.disabled = true;
                    } else {
                        warn.classList.add('hidden');
                        checkoutBtn.disabled = false;
                    }
                } else {
                    actBtn.classList.add('hidden');
                    checkoutBtn.disabled = true;
                    checkoutBtn.innerHTML = '<i class="fa-solid fa-check"></i> Already Paid';
                }
            }
        });
}

// Phase 2: Mock Cron Job button integration
async function triggerAutomations() {
    const term = document.getElementById('automationInbox');
    term.innerHTML = '<div class="log-item text-blue"><i class="fa-solid fa-spinner fa-spin"></i> Running remote background scripts...</div>' + term.innerHTML;

    try {
        const res = await fetch('/api/trigger_automation');
        const data = await res.json();
        
        term.innerHTML = '';
        if(data.notifications.length === 0) {
            term.innerHTML = '<div class="log-item text-muted">No automation triggers fired during this cycle.</div>';
        } else {
            data.notifications.forEach(notif => {
                term.innerHTML = `<div class="log-item shadow-sm" style="border-left: 3px solid var(--orange); margin-bottom: 8px;">
                    <strong>[${notif.type}]</strong> ${notif.message}
                </div>` + term.innerHTML;
            });
        }
        
    } catch(e) {
        term.innerHTML = '<div class="log-item text-red">Failed to contact automation API</div>';
    }
}

function highlightPlan(index) {
    const plans = document.querySelectorAll('.plan-card');
    plans.forEach(p => {
        p.style.border = '1px solid var(--border-color)';
        const badge = p.querySelector('.current-badge');
        if(badge) badge.remove();
    });
    
    if(plans[index]) {
        plans[index].style.border = '2px solid var(--orange)';
        plans[index].innerHTML = `<div class="current-badge bg-orange text-white px-2 py-1 mb-2 d-inline-block rounded shadow-sm" style="font-size:0.7rem;">Your Auto-Assigned Plan</div>` + plans[index].innerHTML;
    }
}

async function fetchEnvironmentData() {
    try {
        const res = await fetch(`/api/mock/zone/${currentWorker.zoneId}`);
        const data = await res.json();
        
        document.getElementById('envWeather').innerText = data.weatherCondition.toUpperCase();
        if(data.currentDemand < data.baselineDemand) {
            const drop = Math.round(((data.baselineDemand - data.currentDemand) / data.baselineDemand) * 100);
            document.getElementById('envDrop').innerText = `-${drop}%`;
        } else {
            document.getElementById('envDrop').innerText = "Normal";
            document.getElementById('envDrop').className = "info-value text-green";
        }
    } catch(e) { console.error(e); }
}

function logout() {
    currentWorker = null;
    pingCount = 0;
    if(autoPingInterval) toggleAutoPing();
    dashboardContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
}

// --- NAVIGATION ---
function switchTab(tabId, element = null) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    } else {
        // Find default active (Overview)
        document.querySelector('.nav-item').classList.add('active');
    }

    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    if (tabId === 'live-map' && !mapInstance) {
        setTimeout(initMap, 100); 
    }
}

// --- PAYMENT & BILLING LOGIC (PHASE 3) ---
async function payPremium() {
    const resEl = document.getElementById('paymentResult');
    const spaceEl = document.getElementById('billDownloadSpace');
    const btn = document.getElementById('payNowBtnCheckout');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-white"></i> Processing via Payment Gateway...';
    resEl.innerHTML = '';
    spaceEl.classList.add('hidden');
    
    try {
        const res = await fetch('/api/pay_premium', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ workerId: currentWorker.workerId })
        });
        const data = await res.json();

        if(res.ok) {
            currentWorker.walletBalance = data.walletBalance;
            updateOverviewPanel();

            resEl.innerHTML = '<i class="fa-solid fa-circle-check text-green fa-2x"></i><br><span class="text-green mt-2 d-inline-block">Payment Successful! Policy is Active.</span>';
            
            // Show Download Bill Option
            spaceEl.classList.remove('hidden');
            spaceEl.innerHTML = `<button class="btn btn-outline-primary" style="padding: 10px;" onclick="downloadBillPDF('${data.transactionId}')">
                <i class="fa-solid fa-file-pdf"></i> Download Official Bill Receipt
            </button>`;

            btn.innerHTML = '<i class="fa-solid fa-check"></i> Already Paid';
            btn.disabled = true;
        } else {
            resEl.innerHTML = `<i class="fa-solid fa-circle-xmark text-red fa-2x"></i><br><span class="text-red mt-2 d-inline-block">FAILED: ${data.error}</span>`;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Securely Pay Now';
        }
    } catch(e) {
        resEl.innerHTML = '<span class="text-red">Network Error during checkout.</span>';
    }
}

function downloadBillPDF(txId) {
    window.open(`/api/finances/bill/${currentWorker.workerId}/${txId}`, '_blank');
}

// --- MAP & PING SIMULATION ---
function initMap() {
    let baseLat = 12.9279, baseLng = 77.6271;
    if(currentWorker.zoneId === 'Mumbai_South') { baseLat = 18.9220; baseLng = 72.8347; }
    else if(currentWorker.zoneId === 'Delhi_NCR') { baseLat = 28.6139; baseLng = 77.2090; }

    mapInstance = L.map('activityMap').setView([baseLat, baseLng], 14);

    // Light map layer for friendly bright theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(mapInstance);
    
    logTerminal(`Map loaded for your zone.`, 'system');
}

async function triggerPing(isMocked) {
    if(!mapInstance) return;

    const center = mapInstance.getCenter();
    const drift = isMocked ? 0.3 : (Math.random() - 0.5) * 0.005;
    const lat = center.lat + drift;
    const lng = center.lng + drift;

    try {
        const res = await fetch('/api/log_activity', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                workerId: currentWorker.workerId, lat, lng, isMocked, status: 'DELIVERING'
            })
        });
        const data = await res.json();
        
        pingCount = data.logCount;
        updateOverviewPanel();

        if(currentMarker) mapInstance.removeLayer(currentMarker);
        
        const iconColor = isMocked ? '#ef4444' : '#10b981';
        const markerHtml = `<div style="background-color: ${iconColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`;
        const customIcon = L.divIcon({ html: markerHtml, className: 'custom-marker' });

        currentMarker = L.marker([lat, lng], {icon: customIcon}).addTo(mapInstance);
        if(!isMocked) mapInstance.setView([lat, lng], 14, {animate: true});

        const time = new Date().toLocaleTimeString();
        if(isMocked) logTerminal(`[${time}] FAKE LOCATION SPOTTED -> Claim might be blocked!`, 'error');
        else logTerminal(`[${time}] Valid location logged. Great job.`, 'success');

        document.getElementById('fileClaimBtn').disabled = false;

    } catch(e) { console.error(e); }
}

function toggleAutoPing() {
    const btn = document.getElementById('autoPingBtn');
    if(autoPingInterval) {
        clearInterval(autoPingInterval);
        autoPingInterval = null;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start Shift (Auto-Movement)';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
        logTerminal(`You paused your shift.`, 'system');
    } else {
        autoPingInterval = setInterval(() => triggerPing(false), 3000);
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Shift';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        logTerminal(`You started your shift! Moving automatically...`, 'success');
    }
}

function logTerminal(msg, type) {
    if(termOutput.innerHTML.includes('Waiting for your first location')) termOutput.innerHTML = '';
    termOutput.innerHTML += `<div class="log-item ${type}">${msg}</div>`;
    termOutput.scrollTop = termOutput.scrollHeight;
}

// --- ILCS & CLAIMS ENGINE ---
async function calculateIlcsAndDrawGraph() {
    const btn = document.getElementById('calcIlcsBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking your history...';

    try {
        const res = await fetch(`/api/calculate_ilcs/${currentWorker.workerId}`);
        const data = await res.json();

        document.getElementById('finalScore').innerText = Math.round(data.score * 10) / 10;
        
        if (data.score >= 60) document.getElementById('finalScore').className = "text-green";
        else document.getElementById('finalScore').className = "text-orange";

        drawChart(data.breakdown);

        if(claimTermOutput.innerHTML.includes('Ready to process claim')) claimTermOutput.innerHTML = '';
        claimTermOutput.innerHTML += `<div class="log-item system">Score generated successfully: ${data.score.toFixed(1)}</div>`;
        claimTermOutput.scrollTop = claimTermOutput.scrollHeight;
    } catch(e) { console.error(e); } finally {
        btn.innerHTML = '<i class="fa-solid fa-calculator"></i> Check My Score';
    }
}

function drawChart(breakdown) {
    const ctx = document.getElementById('ilcsChart').getContext('2d');
    
    if (ilcsChartInstance) ilcsChartInstance.destroy();

    Chart.defaults.color = '#64748b';

    ilcsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Risk (30%)', 'Missing Orders (50%)', 'Your Work (20%)'],
            datasets: [{
                data: [breakdown.environment, breakdown.demandDrop, breakdown.activity],
                backgroundColor: ['#f97316', '#3b82f6', '#10b981'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: '70%'
        }
    });
}

async function fileClaim() {
    const btn = document.getElementById('fileClaimBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Getting Payout...';
    btn.disabled = true;

    if(claimTermOutput.innerHTML.includes('Ready to process claim')) claimTermOutput.innerHTML = '';
    claimTermOutput.innerHTML += `<div class="log-item system">Requesting your payout...</div>`;
    
    try {
        const res = await fetch('/api/claim', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ workerId: currentWorker.workerId })
        });
        const data = await res.json();

        if (data.status === 'Approved') {
            claimTermOutput.innerHTML += `<div class="log-item success">✅ Payout Approved! (Logistic Regression Configured)</div>`;
            claimTermOutput.innerHTML += `<div class="log-item success">₹${data.payoutAmount} transferred to your wallet. Score: ${data.ilcsScore.toFixed(1)}</div>`;
            
            // Sync Front end
            currentWorker.walletBalance = data.walletBalance;
            updateOverviewPanel();
            
            // Display Generated Bill Receipt (PDF button)
            if(data.transactionId) {
                claimTermOutput.innerHTML += `<div class="log-item system" style="margin-top: 10px;">
                    <button class="btn btn-outline-primary" style="padding: 10px; width: 100%;" onclick="downloadBillPDF('${data.transactionId}')">
                        <i class="fa-solid fa-file-pdf"></i> Download Official Payout Bill (PDF)
                    </button>
                </div>`;
            }

        } else {
            claimTermOutput.innerHTML += `<div class="log-item error">❌ Payout Rejected!</div>`;
            claimTermOutput.innerHTML += `<div class="log-item error">Reason: ${data.reason.join(', ')}</div>`;
        }
    } catch(e) { console.error(e); } finally {
        btn.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> Get My Payout Now';
    }
}

// Phase 3: Transaction Statement Downloader (Now PDF)
function downloadStatement() {
    window.open(`/api/finances/statement/pdf/${currentWorker.workerId}`, '_blank');
}
