/* ==========================================================================
   PAYBALL - LOGIN.JS (TERHUBUNG KE DATABASE BARU)
   ========================================================================== */

// ⚠️ PASTIKAN KUNCI INI SAMA PERSIS DENGAN DI HOME.JS
const SUPABASE_URL = "https://ahwopkhvdfbuasifafub.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_L3xwK7rYrGhuVzBQYI-vOA_y5N3H0AP";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi Utama Login
async function handleLogin(event) {
    event.preventDefault(); // Mencegah halaman ke-refresh otomatis
    
    const emailInput = document.getElementById('gmail').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    if (!emailInput || !passwordInput) {
        alert("Gmail dan Password tidak boleh kosong!");
        return;
    }

    try {
        // Proses login ke Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput
        });

        if (error) {
            alert("Login Gagal bang: " + error.message);
        } else {
            // Kalau sukses, panggil pop-up estetik buatan abang
            document.getElementById('modal-success').classList.add('active');
        }
    } catch (err) {
        alert("Terjadi kesalahan sistem: " + err.message);
    }
}

// Fungsi tombol "OK" di dalam Pop-up
function redirectToDashboard() {
    window.location.href = "home.html"; // Melesat ke Dashboard
}
