/* ==========================================================================
   PAYBALL - REGISTER.JS (FIXED: Perbaikan Bug Crash Inisialisasi Supabase)
   ========================================================================== */

const SUPABASE_URL = "https://kfvxdttbohjxbailirsv.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_MXs8T50wIuVy52m2SrkDDQ_swxt8EWq"; 

// FIXED: Menggunakan cara inisialisasi v2 yang benar agar skrip tidak berhenti mendadak
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function handleRegister(event) {
    // 1. Kunci form agar tidak refresh halaman otomatis saat diklik
    event.preventDefault();

    const email = document.getElementById('regGmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (email === "" || password === "") {
        alert("Harap isi Gmail dan Password untuk mendaftar!");
        return;
    }

    try {
        // 2. Jalankan pendaftaran ke Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        // 3. Evaluasi respon server
        if (error) {
            alert("Registrasi Gagal dari Server: " + error.message);
        } else {
            // SUCCESS: Munculkan mockup pop-up kustom jika tidak ada eror
            const modal = document.getElementById('modal-success');
            if (modal) {
                modal.classList.add('active');
            } else {
                // Cadangan jika element modal tidak sengaja terhapus di HTML
                alert("Registrasi Berhasil! Silakan masuk ke halaman login.");
                window.location.href = 'login.html';
            }
        }
    } catch (catchError) {
        console.error("Terjadi eror internal skrip:", catchError);
        alert("Koneksi tersendat, periksa jaringan internet HP Anda!");
    }
}

// Fungsi tombol OK pada pop-up mockup untuk pindah halaman
function redirectToLogin() {
    window.location.href = 'login.html';
}
