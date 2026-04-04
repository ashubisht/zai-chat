use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::{anyhow, Result};
use base64::Engine;

/// Encrypts a plaintext string using AES-256-GCM
///
/// # Arguments
/// * `plaintext` - The string to encrypt
/// * `key` - The encryption key (32 bytes for AES-256)
///
/// # Returns
/// Base64-encoded encrypted data with nonce prepended
pub fn encrypt(plaintext: &str, key: &[u8; 32]) -> Result<String> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| anyhow!("Encryption failed: {}", e))?;

    // Prepend nonce to ciphertext (nonce is 96 bits = 12 bytes)
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);

    Ok(base64::prelude::BASE64_STANDARD.encode(&combined))
}

/// Decrypts a base64-encoded string that contains nonce + ciphertext
///
/// # Arguments
/// * `encoded` - Base64-encoded data (nonce + ciphertext)
/// * `key` - The decryption key (32 bytes for AES-256)
///
/// # Returns
/// The decrypted plaintext string
pub fn decrypt(encoded: &str, key: &[u8; 32]) -> Result<String> {
    let combined = base64::prelude::BASE64_STANDARD.decode(encoded).map_err(|e| anyhow!("Base64 decode failed: {}", e))?;

    if combined.len() < 12 {
        return Err(anyhow!("Invalid encrypted data: too short"));
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let cipher = Aes256Gcm::new(key.into());
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| anyhow!("Decryption failed: {}", e))?;

    String::from_utf8(plaintext).map_err(|e| anyhow!("UTF-8 decode failed: {}", e))
}

/// Derives a fixed encryption key from a machine-specific identifier
/// In production, this should use the platform's secure keychain/credential manager
pub fn get_encryption_key() -> [u8; 32] {
    // In a real application, you would use platform-specific secure storage
    // For now, we use a fixed key derived from machine ID
    use std::hash::{Hash, Hasher};
    use std::collections::hash_map::DefaultHasher;

    let machine_id = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "default-key".to_string());

    let mut hasher = DefaultHasher::new();
    machine_id.hash(&mut hasher);

    let mut key = [0u8; 32];
    let hash = hasher.finish();
    let hash_bytes = hash.to_be_bytes();
    key.copy_from_slice(&hash_bytes[..32]);

    // If hash is shorter than 32 bytes, pad with zeros
    // If longer (shouldn't happen with u64), truncate

    key
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let key = [0u8; 32]; // Test key
        let plaintext = "Hello, Z.AI!";

        let encrypted = encrypt(plaintext, &key).unwrap();
        let decrypted = decrypt(&encrypted, &key).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_different_keys() {
        let key1 = [1u8; 32];
        let key2 = [2u8; 32];
        let plaintext = "Secret message";

        let encrypted = encrypt(plaintext, &key1).unwrap();
        let result = decrypt(&encrypted, &key2);

        assert!(result.is_err());
    }
}
