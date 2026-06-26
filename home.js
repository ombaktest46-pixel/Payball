/* ==========================================================================
   PAYBALL - HOME.JS COMPLETE CLEAN VERSION (FIXED POP-UP DETAIL + DARK MODE)
   ========================================================================== */

const SUPABASE_URL = "https://ahwopkhvdfbuasifafub.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_L3xwK7rYrGhuVzBQYI-vOA_y5N3H0AP";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let appState = {
    userId: null,
    saldo: 0, targetSaldo: 6000000, deviceName: "PayBall",
    profileImage: "",
    accounts: [],
    history: { buyCount: 0, sellCount: 0, totalBuy: 0, totalSell: 0, profit: 0 },
    chartBars: []
};
let temporaryImageBase64 = "";
let temporaryProfileImageBase64 = "";
let currentEditingAccountId = null;
let selectedSellId = null;
let currentBeliPrice = 0;

/* =========================================================
   LOAD DATA
   ========================================================= */
async function loadFromSupabase() {
    try {
        // Ganti getUser() dengan getSession()
const { data: { session }, error: sError } = await supabaseClient.auth.getSession();

// Periksa session, bukan user langsung
if (sError || !session) {
    alert("Sesi login habis. Silakan login kembali!");
    window.location.href = "login.html";
    return;
}

// Ambil user dari session yang sudah tervalidasi
const user = session.user;
       
        appState.userId = user.id;

        let { data: finance, error: fError } = await supabaseClient
            .from('app_finance')
            .select('*')
            .eq('user_id', appState.userId)
            .maybeSingle();

        if (fError) throw fError;

        if (!finance) {
            const { data: newFinance, error: initError } = await supabaseClient
                .from('app_finance')
                .insert([{
                    user_id: appState.userId,
                    saldo: 0, target_saldo: 6000000, device_name: "PayBall",
                    profile_image: "", buy_count: 0, sell_count: 0,
                    total_buy: 0, total_sell: 0, profit: 0, chart_bars: []
                }])
                .select()
                .single();
            if (initError) throw initError;
            finance = newFinance;
        }

        let { data: accounts, error: aError } = await supabaseClient
            .from('accounts')
            .select('*')
            .eq('user_id', appState.userId)
            .order('created_at', { ascending: false });
        if (aError) throw aError;

        appState.saldo        = finance.saldo || 0;
        appState.targetSaldo  = finance.target_saldo || 6000000;
        appState.deviceName   = finance.device_name || "PayBall";
        appState.profileImage = finance.profile_image || "";
        appState.history = {
            buyCount:  finance.buy_count,
            sellCount: finance.sell_count,
            totalBuy:  finance.total_buy,
            totalSell: finance.total_sell,
            profit:    finance.profit
        };
        appState.chartBars = typeof finance.chart_bars === 'string'
            ? JSON.parse(finance.chart_bars)
            : (finance.chart_bars || []);
        appState.accounts = accounts || [];

        document.getElementById('in-profile-username').value = appState.deviceName;
        if (appState.profileImage) {
            document.getElementById('profile-placeholder-icon').style.display = 'none';
            document.getElementById('profile-image-preview').src = appState.profileImage;
            document.getElementById('profile-image-preview').style.display = 'block';
        }

        renderDOM();
    } catch (err) {
        alert("CRASH DATABASE: " + err.message);
    }
}

/* =========================================================
   AUTH
   ========================================================= */
async function logoutUser() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
    } catch (error) {
        alert("Gagal logout: " + error.message);
    }
}

/* =========================================================
   NAVIGASI
   ========================================================= */
function switchSection(target) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-icon').forEach(icon => icon.classList.remove('active'));
    if (target === 'home') {
        document.getElementById('section-home').classList.add('active');
        document.getElementById('nav-btn-home').classList.add('active');
    } else if (target === 'history') {
        document.getElementById('section-history').classList.add('active');
        document.getElementById('nav-btn-history').classList.add('active');
    }
}

/* =========================================================
   MODAL
   ========================================================= */
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showSuccess(msg) {
    document.getElementById('success-popup-message').innerText = msg;
    openModal('modal-success');
}

/* =========================================================
   PROFILE
   ========================================================= */
function triggerProfileImageUpload() {
    document.getElementById('hidden-profile-file-input').click();
}

function previewProfileImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        temporaryProfileImageBase64 = e.target.result;
        document.getElementById('profile-placeholder-icon').style.display = 'none';
        const prev = document.getElementById('profile-image-preview');
        prev.src = temporaryProfileImageBase64;
        prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

async function saveProfileSettings() {
    try {
        const usernameInput = document.getElementById('in-profile-username').value.trim();
        if (!usernameInput) return alert("Username tidak boleh kosong!");

        let imgUrlToSave = temporaryProfileImageBase64 || appState.profileImage;
        closeModal('modal-profile-settings');

        const { error } = await supabaseClient
            .from('app_finance')
            .update({ device_name: usernameInput, profile_image: imgUrlToSave })
            .eq('user_id', appState.userId);

        if (error) {
            alert("Gagal memperbarui profile: " + error.message);
        } else {
            appState.deviceName   = usernameInput;
            appState.profileImage = imgUrlToSave;
            temporaryProfileImageBase64 = "";
            renderDOM();
            showSuccess("Profile berhasil diperbarui!");
        }
    } catch (err) {
        alert("Error profile: " + err.message);
    }
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */
function triggerImageUpload() {
    document.getElementById('hidden-file-input').click();
}

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        temporaryImageBase64 = e.target.result;
        document.getElementById('upload-placeholder-icon').style.display = 'none';
        const prev = document.getElementById('image-preview');
        prev.src = temporaryImageBase64;
        prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    temporaryImageBase64 = "";
    document.getElementById('upload-placeholder-icon').style.display = 'block';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-preview').src = "";
    document.getElementById('hidden-file-input').value = "";
}

/* =========================================================
   ACCOUNT DETAIL (HOME - bisa edit)
   ========================================================= */
function openAccountDetail(id) {
    const acc = appState.accounts.find(a => a.id == id);
    if (!acc) return;
    currentEditingAccountId = id;

    document.getElementById('detail-in-gmail').value     = acc.gmail       || "";
    document.getElementById('detail-in-password').value  = acc.password    || "";
    document.getElementById('detail-in-sisalogin').value = acc.sisalogin   || "";
    document.getElementById('detail-in-koin').value      = acc.koin        || "";
    document.getElementById('detail-in-data').value      = acc.data_status || "";
    document.getElementById('detail-in-mdb').value       = acc.manager_db  || 0;
    document.getElementById('detail-in-region').value    = acc.region      || "";
    document.getElementById('detail-in-epic').value      = acc.epic        || "";
    document.getElementById('detail-in-beli').value      = acc.beli        || 0;
    document.getElementById('detail-in-jual').value      = acc.jual        || 0;

    const imgCont = document.getElementById('detail-img-container');
    imgCont.innerHTML = acc.image_base64
        ? '<img src="' + acc.image_base64 + '" style="width:100%;height:100%;object-fit:cover;">'
        : '<div style="padding:20px;text-align:center;font-weight:bold;">No Image</div>';

    openModal('modal-account-detail');
}

async function saveAccountEdits() {
    try {
        if (!currentEditingAccountId || !appState.userId) return;

        const g  = document.getElementById('detail-in-gmail').value.trim();
        const p  = document.getElementById('detail-in-password').value.trim();
        const sl = document.getElementById('detail-in-sisalogin').value.trim();
        const k  = document.getElementById('detail-in-koin').value.trim();
        const d  = document.getElementById('detail-in-data').value.trim();
        const m  = parseInt(document.getElementById('detail-in-mdb').value)  || 0;
        const r  = document.getElementById('detail-in-region').value.trim();
        const e  = document.getElementById('detail-in-epic').value.trim();
        const b  = parseInt(document.getElementById('detail-in-beli').value) || 0;
        const j  = parseInt(document.getElementById('detail-in-jual').value) || 0;

        if (!g || !p) return alert("Gmail dan Password tidak boleh kosong!");

        closeModal('modal-account-detail');

        const { data, error } = await supabaseClient
            .from('accounts')
            .update({ gmail: g, password: p, sisalogin: sl, koin: k,
                      data_status: d, manager_db: m, region: r, epic: e, beli: b, jual: j })
            .eq('id', currentEditingAccountId)
            .eq('user_id', appState.userId)
            .select();

        if (error) {
            alert("Gagal update akun: " + error.message);
        } else {
            appState.accounts = appState.accounts.map(item =>
                item.id == currentEditingAccountId ? data[0] : item
            );
            currentEditingAccountId = null;
            renderDOM();
            showSuccess("Data akun berhasil diperbarui!");
        }
    } catch (err) {
        alert("Gagal simpan perubahan: " + err.message);
    }
}

/* =========================================================
   HISTORY DETAIL (read-only, tanpa beli/jual)
   ========================================================= */
function openHistoryDetail(id) {
    const acc = appState.accounts.find(a => a.id == id);
    if (!acc) return;

    document.getElementById('hist-detail-gmail').innerText     = acc.gmail       || "-";
    document.getElementById('hist-detail-password').innerText  = acc.password    || "-";
    document.getElementById('hist-detail-sisalogin').innerText = acc.sisalogin   || "-";
    document.getElementById('hist-detail-koin').innerText      = acc.koin        || "-";
    document.getElementById('hist-detail-data').innerText      = acc.data_status || "-";
    document.getElementById('hist-detail-mdb').innerText       = acc.manager_db  || "0";
    document.getElementById('hist-detail-region').innerText    = acc.region      || "-";
    document.getElementById('hist-detail-epic').innerText      = acc.epic        || "-";

    const imgEl = document.getElementById('hist-detail-img');
    imgEl.innerHTML = acc.image_base64
        ? '<img src="' + acc.image_base64 + '" style="width:100%;height:100%;object-fit:cover;">'
        : '<div style="padding:20px;text-align:center;font-weight:bold;color:#888;">No Image</div>';

    openModal('modal-history-detail');
}

/* =========================================================
   RENDER DOM
   ========================================================= */
function renderDOM() {
    document.getElementById('display-saldo').innerText    = "RP. " + appState.saldo.toLocaleString('id-ID');
    document.getElementById('display-username').innerText = appState.deviceName;
    document.getElementById('display-device').innerText   = appState.deviceName;

    let ratio = (appState.saldo / appState.targetSaldo) * 100;
    document.getElementById('display-progress').style.width = (ratio > 100 ? 100 : ratio) + "%";
    document.getElementById('display-ratio').innerText =
        Math.floor(appState.saldo / 1000) + "/" + Math.floor(appState.targetSaldo / 1000);

    const profilePicDiv = document.getElementById('display-profile-pic');
    profilePicDiv.innerHTML = appState.profileImage
        ? '<img src="' + appState.profileImage + '">'
        : "";

    const listHome     = document.getElementById('account-list');
    const sliderHist   = document.getElementById('history-account-slider');
    const showcaseList = document.getElementById('showcase-list');

    listHome.innerHTML   = "";
    sliderHist.innerHTML = "";
    if (showcaseList) showcaseList.innerHTML = "";

    if (appState.accounts.length === 0) {
        if (showcaseList) {
            showcaseList.innerHTML = "<p style='text-align:center;color:#888;font-weight:bold;margin-top:20px;'>Belum ada akun di katalog.</p>";
        }
    }

    appState.accounts.forEach(function(acc) {
        var maskGmail = acc.gmail.length > 15
            ? acc.gmail.substring(0, 15) + "..."
            : acc.gmail;

        var imgTag = acc.image_base64
            ? '<img src="' + acc.image_base64 + '" style="width:100%;height:100%;object-fit:cover;">'
            : '<div style="width:100%;height:100%;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;">No Image</div>';

        var imgTagKatalog = acc.image_base64
            ? '<img src="' + acc.image_base64 + '" class="showcase-img">'
            : '<div class="showcase-img" style="background:#111;color:#fff;display:flex;align-items:center;justify-content:center;">No Image</div>';

        var accId = acc.id;

        listHome.innerHTML +=
            '<div class="account-card-h" onclick="openAccountDetail(\'' + accId + '\')">' +
                '<div style="width:90px;height:60px;border-radius:8px;overflow:hidden;flex-shrink:0;">' + imgTag + '</div>' +
                '<div class="acc-info-h">' +
                    'GMAIL:' + maskGmail + '<br>' +
                    'Koin:' + (acc.koin || '-') + ' | EPIC:' + (acc.epic || '-') + '<br>' +
                    'BELI:' + acc.beli.toLocaleString('id-ID') + ' | Jual:' + acc.jual.toLocaleString('id-ID') +
                '</div>' +
            '</div>';

        sliderHist.innerHTML +=
            '<div class="slider-card" onclick="openHistoryDetail(\'' + accId + '\')">' +
                '<div style="width:100%;height:120px;border-radius:12px;overflow:hidden;margin-bottom:10px;">' + imgTag + '</div>' +
                '<h3>BUY: ' + acc.beli.toLocaleString('id-ID') + '</h3>' +
                '<small>Tap for details / edit</small>' +
                '<div class="btn-sell-circle" onclick="event.stopPropagation(); openSellModal(\'' + accId + '\', ' + acc.beli + ', ' + acc.jual + ')">Sell</div>' +
            '</div>';

        if (showcaseList) {
            showcaseList.innerHTML +=
                '<div class="showcase-card">' +
                    imgTagKatalog +
                    '<div class="showcase-info">' +
                        '<div style="display:flex;justify-content:space-between;">' +
                            '<span><strong>Koin:</strong> ' + (acc.koin || '-') + '</span>' +
                            '<span><strong>Data:</strong> ' + (acc.data_status || 'Aman') + '</span>' +
                        '</div>' +
                        '<div style="margin-top:5px;">' +
                            '<strong>Spec:</strong> ' + (acc.epic || '-') + '<br>' +
                            '<strong>MDB:</strong> ' + (acc.manager_db || '0') + ' | <strong>Region:</strong> ' + (acc.region || 'Indonesia') + '<br>' +
                            '<strong style="color:#0056FF;margin-top:3px;display:inline-block;">Sisa Login: ' + (acc.sisalogin || '-') + '</strong>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }
    });

    document.getElementById('hist-buy-count').innerText  = appState.history.buyCount;
    document.getElementById('hist-sell-count').innerText = appState.history.sellCount;
    document.getElementById('hist-total-buy').innerText  = appState.history.totalBuy.toLocaleString('id-ID');
    document.getElementById('hist-total-sell').innerText = appState.history.totalSell.toLocaleString('id-ID');
    document.getElementById('hist-profit').innerText     = appState.history.profit.toLocaleString('id-ID');

    var chartCont = document.getElementById('chart-container');
    chartCont.innerHTML = "";
    appState.chartBars.slice(-6).forEach(function(bar) {
        var barEl = document.createElement('div');
        barEl.className    = bar.type === 'buy' ? 'chart-bar buy-bar' : 'chart-bar';
        barEl.style.height = bar.height + "%";
        chartCont.appendChild(barEl);
    });
}

/* =========================================================
   ADD ACCOUNT (BUY)
   ========================================================= */
async function saveNewAccount() {
    try {
        if (!appState.userId) return;

        var gValue   = document.getElementById('in-gmail').value.trim();
        var pValue   = document.getElementById('in-pass').value.trim();
        var slValue  = document.getElementById('in-sisalogin').value.trim();
        var kValue   = document.getElementById('in-koin').value.trim();
        var dValue   = document.getElementById('in-data').value.trim();
        var mdbValue = parseInt(document.getElementById('in-mdb').value)  || 0;
        var rValue   = document.getElementById('in-region').value.trim();
        var eValue   = document.getElementById('in-epic').value.trim();
        var bValue   = parseInt(document.getElementById('in-beli').value) || 0;
        var jValue   = parseInt(document.getElementById('in-jual').value) || 0;

        if (!gValue || !pValue) {
            alert("Gmail dan Password wajib diisi!");
            return;
        }

        var newSaldo         = appState.saldo - bValue;
        var newBuyCount      = appState.history.buyCount + 1;
        var newTotalBuy      = appState.history.totalBuy + bValue;
        var barHeight        = Math.floor(Math.random() * 60) + 20;
        var updatedChartBars = appState.chartBars.concat([{ type: 'buy', height: barHeight }]);

        var updateFinance = supabaseClient
            .from('app_finance')
            .update({ saldo: newSaldo, buy_count: newBuyCount,
                      total_buy: newTotalBuy, chart_bars: updatedChartBars })
            .eq('user_id', appState.userId)
            .select();

        var insertAccount = supabaseClient
            .from('accounts')
            .insert([{
                user_id: appState.userId,
                gmail: gValue, password: pValue, sisalogin: slValue, koin: kValue,
                data_status: dValue, manager_db: mdbValue, region: rValue, epic: eValue,
                beli: bValue, jual: jValue, image_base64: temporaryImageBase64
            }])
            .select();

        var results = await Promise.all([updateFinance, insertAccount]);

        if (results[0].error || results[1].error) {
            var errFinance = results[0].error ? results[0].error.message : "Aman";
            var errAkun    = results[1].error ? results[1].error.message : "Aman";
            alert("GAGAL CLOUD!\nError Saldo: " + errFinance + "\nError Akun: " + errAkun);
            loadFromSupabase();
        } else {
            document.querySelectorAll('#modal-add-account input').forEach(function(input) { input.value = ''; });
            resetUpload();
            closeModal('modal-add-account');

            appState.saldo            = newSaldo;
            appState.history.buyCount = newBuyCount;
            appState.history.totalBuy = newTotalBuy;
            appState.chartBars        = updatedChartBars;
            appState.accounts.unshift(results[1].data[0]);
            renderDOM();
            showSuccess("Data akun berhasil disimpan!");
        }
    } catch (err) {
        alert("Kesalahan internal: " + err.message);
    }
}

/* =========================================================
   SELL
   ========================================================= */
function openSellModal(id, beliPrice, jualPrice) {
    selectedSellId   = id;
    currentBeliPrice = beliPrice;
    document.getElementById('sell-price-input').value = jualPrice || "";
    openModal('modal-sell-process');
}

async function executeSell() {
    try {
        if (!selectedSellId || !appState.userId) return;

        var finalPrice = parseInt(document.getElementById('sell-price-input').value) || 0;
        if (finalPrice <= 0) {
            alert("Harga jual harus valid!");
            return;
        }

        var profit           = finalPrice - currentBeliPrice;
        var newSaldo         = appState.saldo + finalPrice;
        var newSellCount     = appState.history.sellCount + 1;
        var newTotalSell     = appState.history.totalSell + finalPrice;
        var newProfit        = appState.history.profit + profit;
        var barHeight        = Math.floor(Math.random() * 60) + 40;
        var updatedChartBars = appState.chartBars.concat([{ type: 'sell', height: barHeight }]);

        closeModal('modal-sell-process');

        var deleteAccount = supabaseClient
            .from('accounts')
            .delete()
            .eq('id', selectedSellId)
            .eq('user_id', appState.userId);

        var updateFinance = supabaseClient
            .from('app_finance')
            .update({ saldo: newSaldo, sell_count: newSellCount,
                      total_sell: newTotalSell, profit: newProfit, chart_bars: updatedChartBars })
            .eq('user_id', appState.userId)
            .select();

        var results = await Promise.all([deleteAccount, updateFinance]);

        if (results[0].error || results[1].error) {
            alert("Gagal jual akun! Coba lagi.");
            loadFromSupabase();
            return;
        }

        appState.saldo             = newSaldo;
        appState.history.sellCount = newSellCount;
        appState.history.totalSell = newTotalSell;
        appState.history.profit    = newProfit;
        appState.chartBars         = updatedChartBars;
        
        appState.accounts          = appState.accounts.filter(function(a) { return a.id != selectedSellId; });

        selectedSellId   = null;
        currentBeliPrice = 0;

        renderDOM();
        showSuccess("Akun berhasil terjual! Profit: " + profit.toLocaleString('id-ID'));

    } catch (err) {
        alert("Error saat menjual: " + err.message);
    }
}

/* =========================================================
   TOP UP
   ========================================================= */
async function executeTopUp() {
    try {
        if (!appState.userId) {
            alert("Sesi tidak ditemukan! Silakan login ulang.");
            window.location.href = "login.html";
            return;
        }

        var amount = parseInt(document.getElementById('topup-amount-input').value) || 0;
        if (amount <= 0) {
            alert("Nominal harus valid!");
            return;
        }

        var newSaldo = appState.saldo + amount;

        var result = await supabaseClient
            .from('app_finance')
            .update({ saldo: newSaldo })
            .eq('user_id', appState.userId)
            .select();

        if (result.error) {
            alert("Top up gagal: " + result.error.message);
            return;
        }

        closeModal('modal-topup');
        document.getElementById('topup-amount-input').value = "";
        appState.saldo = newSaldo;
        renderDOM();
        showSuccess("Top Up Berhasil!");

    } catch (err) {
        alert("Gagal memproses top up: " + err.message);
    }
}

/* =========================================================
   DARK MODE TOGGLE (COMIC VIBES) 🦇
   ========================================================= */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Simpan di memori HP biar pas dibuka lagi tetep Dark Mode
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('payball_comic_mode', 'ON');
    } else {
        localStorage.setItem('payball_comic_mode', 'OFF');
    }
}

// Cek pas aplikasi baru dibuka, apakah sebelumnya Dark Mode?
if (localStorage.getItem('payball_comic_mode') === 'ON') {
    document.body.classList.add('dark-mode');
}
// Taruh di paling bawah home.js
function toggleText(id) {
    const el = document.getElementById(id);
    if (!el.dataset.original) {
        el.dataset.original = el.innerText;
    }
    if (el.innerText !== "••••••••") {
        el.innerText = "••••••••";
    } else {
        el.innerText = el.dataset.original;
    }
}


/* =========================================================
   INIT
   ========================================================= */
window.addEventListener('DOMContentLoaded', loadFromSupabase);
