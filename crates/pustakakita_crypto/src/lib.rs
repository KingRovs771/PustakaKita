use wasm_bindgen::prelude::*;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use subtle::ConstantTimeEq;

type HmacSha256 = Hmac<Sha256>;

/// Hashing NISN 10 Digit Menggunakan HMAC-SHA256 (Rust Wasm)
/// Mencegah enumerasi dan brute-force identitas siswa sesuai UU PDP & PRD Section 5.4
#[wasm_bindgen]
pub fn hash_nisn(raw_nisn: &str, pepper: &str) -> Result<String, JsValue> {
    // Normalisasi: hanya ambil angka numerik, maks 10 karakter
    let filtered_nisn: String = raw_nisn.chars().filter(|c| c.is_ascii_digit()).take(10).collect();
    
    if filtered_nisn.len() != 10 {
        return Err(JsValue::from_str("NISN harus terdiri dari 10 digit angka"));
    }

    let mut mac = HmacSha256::new_from_slice(pepper.as_bytes())
        .map_err(|_| JsValue::from_str("Kunci pepper HMAC tidak valid"))?;
    
    mac.update(filtered_nisn.as_bytes());
    let result = mac.finalize();
    let bytes = result.into_bytes();
    
    Ok(hex::encode(bytes))
}

/// Verifikasi NISN Hash secara Constant-Time untuk mencegah Timing Attack
#[wasm_bindgen]
pub fn verify_nisn_hash(raw_nisn: &str, pepper: &str, expected_hash_hex: &str) -> bool {
    match hash_nisn(raw_nisn, pepper) {
        Ok(computed_hash) => {
            let a = computed_hash.as_bytes();
            let b = expected_hash_hex.as_bytes();
            if a.len() != b.len() {
                return false;
            }
            a.ct_eq(b).into()
        }
        Err(_) => false,
    }
}

/// Validasi Format Token Sesi Ringan di level Wasm
#[wasm_bindgen]
pub fn validate_nisn_format(raw_nisn: &str) -> bool {
    let digits: Vec<char> = raw_nisn.chars().filter(|c| c.is_ascii_digit()).collect();
    digits.len() == 10
}

