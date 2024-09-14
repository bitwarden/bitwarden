use ed25519;
use pkcs8::{der::Decode, ObjectIdentifier, PrivateKeyInfo, SecretDocument};
use ssh_key::{
    private::{Ed25519Keypair, Ed25519PrivateKey, RsaKeypair},
    HashAlg, LineEnding,
};

const PKCS1_HEADER: &str = "-----BEGIN RSA PRIVATE KEY-----";
const PKCS8_UNENCRYPTED_HEADER: &str = "-----BEGIN PRIVATE KEY-----";
const PKCS8_ENCRYPTED_HEADER: &str = "-----BEGIN ENCRYPTED PRIVATE KEY-----";
const OPENSSH_HEADER: &str = "-----BEGIN OPENSSH PRIVATE KEY-----";

pub const RSA_PKCS8_ALGORITHM_OID: ObjectIdentifier =
    ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.1");

enum KeyType {
    Ed25519,
    Rsa,
    Unknown,
}

pub fn import_key(
    encoded_key: String,
    password: String,
) -> Result<SshKeyImportResult, anyhow::Error> {
    match encoded_key.lines().next() {
        Some(PKCS1_HEADER) => {
            return Ok(SshKeyImportResult {
                status: SshKeyImportStatus::ParsingError,
                ssh_key: None,
            });
        }
        Some(PKCS8_UNENCRYPTED_HEADER | PKCS8_ENCRYPTED_HEADER) => {
            match import_pkcs8_key(encoded_key, None) {
                Ok(result) => {
                    return Ok(result);
                }
                Err(err) => match err {
                    SshKeyImportError::PasswordRequired => {
                        return Ok(SshKeyImportResult {
                            status: SshKeyImportStatus::PasswordRequired,
                            ssh_key: None,
                        });
                    }
                    SshKeyImportError::WrongPassword => {
                        return Ok(SshKeyImportResult {
                            status: SshKeyImportStatus::WrongPassword,
                            ssh_key: None,
                        });
                    }
                    SshKeyImportError::ParsingError => {
                        return Ok(SshKeyImportResult {
                            status: SshKeyImportStatus::ParsingError,
                            ssh_key: None,
                        });
                    }
                },
            }
        }
        Some(OPENSSH_HEADER) => {
            return import_openssh_key(encoded_key, password);
        }
        Some(_) => {
            return Ok(SshKeyImportResult {
                status: SshKeyImportStatus::ParsingError,
                ssh_key: None,
            });
        }
        None => {
            return Ok(SshKeyImportResult {
                status: SshKeyImportStatus::ParsingError,
                ssh_key: None,
            });
        }
    }
}

fn import_pkcs8_key(
    encoded_key: String,
    password: Option<String>,
) -> Result<SshKeyImportResult, SshKeyImportError> {
    let der = match SecretDocument::from_pem(&encoded_key) {
        Ok((_, doc)) => doc,
        Err(_) => {
            return Ok(SshKeyImportResult {
                status: SshKeyImportStatus::ParsingError,
                ssh_key: None,
            });
        }
    };

    let key_type: KeyType = match PrivateKeyInfo::from_der(der.as_bytes())
        .map_err(|_| SshKeyImportError::ParsingError)?
        .algorithm
        .oid
    {
        ed25519::pkcs8::ALGORITHM_OID => KeyType::Ed25519,
        RSA_PKCS8_ALGORITHM_OID => KeyType::Rsa,
        _ => KeyType::Unknown,
    };

    match key_type {
        KeyType::Ed25519 => {
            let pk: ed25519::KeypairBytes = match password {
                Some(password) => {
                    pkcs8::DecodePrivateKey::from_pkcs8_encrypted_pem(&encoded_key, password)
                        .map_err(|err| match err {
                            ed25519::pkcs8::Error::EncryptedPrivateKey(_) => {
                                SshKeyImportError::WrongPassword
                            }
                            _ => SshKeyImportError::ParsingError,
                        })?
                }
                None => ed25519::pkcs8::DecodePrivateKey::from_pkcs8_pem(&encoded_key)
                    .map_err(|_| SshKeyImportError::ParsingError)?,
            };
            let pk: Ed25519Keypair =
                Ed25519Keypair::from(Ed25519PrivateKey::from_bytes(&pk.secret_key));
            let private_key = ssh_key::private::PrivateKey::from(pk);
            return Ok(SshKeyImportResult {
                status: SshKeyImportStatus::Success,
                ssh_key: Some(SshKey {
                    private_key: private_key.to_openssh(LineEnding::LF).unwrap().to_string(),
                    public_key: private_key.public_key().to_string(),
                    key_fingerprint: private_key.fingerprint(HashAlg::Sha256).to_string(),
                }),
            });
        }
        KeyType::Rsa => {
            let pk: rsa::RsaPrivateKey = match password {
                Some(password) => {
                    pkcs8::DecodePrivateKey::from_pkcs8_encrypted_pem(&encoded_key, password)
                        .map_err(|err| match err {
                            pkcs8::Error::EncryptedPrivateKey(_) => {
                                SshKeyImportError::WrongPassword
                            }
                            _ => SshKeyImportError::ParsingError,
                        })?
                }
                None => pkcs8::DecodePrivateKey::from_pkcs8_pem(&encoded_key)
                    .map_err(|_| SshKeyImportError::ParsingError)?,
            };
            let rsa_keypair: Result<RsaKeypair, ssh_key::Error> = RsaKeypair::try_from(pk);
            match rsa_keypair {
                Ok(rsa_keypair) => {
                    let private_key = ssh_key::private::PrivateKey::from(rsa_keypair);
                    return Ok(SshKeyImportResult {
                        status: SshKeyImportStatus::Success,
                        ssh_key: Some(SshKey {
                            private_key: private_key
                                .to_openssh(LineEnding::LF)
                                .unwrap()
                                .to_string(),
                            public_key: private_key.public_key().to_string(),
                            key_fingerprint: private_key.fingerprint(HashAlg::Sha256).to_string(),
                        }),
                    });
                }
                Err(_) => {
                    return Ok(SshKeyImportResult {
                        status: SshKeyImportStatus::ParsingError,
                        ssh_key: None,
                    });
                }
            }
        }
        _ => {
            return Ok(SshKeyImportResult {
                status: SshKeyImportStatus::ParsingError,
                ssh_key: None,
            });
        }
    }
}

fn import_openssh_key(
    encoded_key: String,
    password: String,
) -> Result<SshKeyImportResult, anyhow::Error> {
    let private_key = ssh_key::private::PrivateKey::from_openssh(&encoded_key);
    let private_key = match private_key {
        Ok(k) => k,
        Err(_) => {
            return Ok(SshKeyImportResult {
                status: SshKeyImportStatus::ParsingError,
                ssh_key: None,
            });
        }
    };

    if private_key.is_encrypted() && password.is_empty() {
        return Ok(SshKeyImportResult {
            status: SshKeyImportStatus::PasswordRequired,
            ssh_key: None,
        });
    }
    let private_key = if private_key.is_encrypted() {
        match private_key.decrypt(password.as_bytes()) {
            Ok(k) => k,
            Err(_) => {
                return Ok(SshKeyImportResult {
                    status: SshKeyImportStatus::WrongPassword,
                    ssh_key: None,
                });
            }
        }
    } else {
        private_key
    };

    match private_key.to_openssh(LineEnding::LF) {
        Ok(private_key_openssh) => Ok(SshKeyImportResult {
            status: SshKeyImportStatus::Success,
            ssh_key: Some(SshKey {
                private_key: private_key_openssh.to_string(),
                public_key: private_key.public_key().to_string(),
                key_fingerprint: private_key.fingerprint(HashAlg::Sha256).to_string(),
            }),
        }),
        Err(_) => Ok(SshKeyImportResult {
            status: SshKeyImportStatus::ParsingError,
            ssh_key: None,
        }),
    }
}

#[derive(PartialEq, Debug)]
pub enum SshKeyImportStatus {
    /// ssh key was parsed correctly and will be returned in the result
    Success,
    /// ssh key was parsed correctly but is encrypted and requires a password
    PasswordRequired,
    /// ssh key was parsed correctly, and a password was provided when calling the import, but it was incorrect
    WrongPassword,
    /// ssh key could not be parsed, either due to an incorrect / unsupported format (pkcs#8) or key type (ecdsa), or because the input is not an ssh key
    ParsingError,
}

pub enum SshKeyImportError {
    ParsingError,
    PasswordRequired,
    WrongPassword,
}

pub struct SshKeyImportResult {
    pub status: SshKeyImportStatus,
    pub ssh_key: Option<SshKey>,
}

pub struct SshKey {
    pub private_key: String,
    pub public_key: String,
    pub key_fingerprint: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn import_key_ed25519_openssh_unencrypted() {
        let private_key = include_str!("./test_keys/ed25519_openssh_unencrypted");
        let public_key = include_str!("./test_keys/ed25519_openssh_unencrypted.pub").trim();
        let result = import_key(private_key.to_string(), "".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::Success);
        assert_eq!(result.ssh_key.unwrap().public_key, public_key);
    }

    #[test]
    fn import_key_ed25519_openssh_encrypted() {
        let private_key = include_str!("./test_keys/ed25519_openssh_encrypted");
        let public_key = include_str!("./test_keys/ed25519_openssh_encrypted.pub").trim();
        let result = import_key(private_key.to_string(), "password".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::Success);
        assert_eq!(result.ssh_key.unwrap().public_key, public_key);
    }

    #[test]
    fn import_key_rsa_openssh_unencrypted() {
        let private_key = include_str!("./test_keys/rsa_openssh_unencrypted");
        let public_key = include_str!("./test_keys/rsa_openssh_unencrypted.pub").trim();
        let result = import_key(private_key.to_string(), "".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::Success);
        assert_eq!(result.ssh_key.unwrap().public_key, public_key);
    }

    #[test]
    fn import_key_rsa_openssh_encrypted() {
        let private_key = include_str!("./test_keys/rsa_openssh_encrypted");
        let public_key = include_str!("./test_keys/rsa_openssh_encrypted.pub").trim();
        let result = import_key(private_key.to_string(), "password".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::Success);
        assert_eq!(result.ssh_key.unwrap().public_key, public_key);
    }

    #[test]
    fn import_key_ed25519_pkcs8_unencrypted() {
        let private_key = include_str!("./test_keys/ed25519_pkcs8_unencrypted");
        let public_key = include_str!("./test_keys/ed25519_pkcs8_unencrypted.pub").trim();
        let result = import_key(private_key.to_string(), "".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::Success);
        assert_eq!(result.ssh_key.unwrap().public_key, public_key);
    }

    #[test]
    fn import_key_ed25519_pkcs8_encrypted() {
        let private_key = include_str!("./test_keys/ed25519_pkcs8_encrypted");
        let public_key = include_str!("./test_keys/ed25519_pkcs8_encrypted.pub").trim();
        let result = import_key(private_key.to_string(), "password".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::Success);
        assert_eq!(result.ssh_key.unwrap().public_key, public_key);
    }

    #[test]
    fn import_key_rsa_pkcs8_unencrypted() {
        let private_key = include_str!("./test_keys/rsa_pkcs8_unencrypted");
        // for whatever reason pkcs8 + rsa does not include the comment in the public key
        let public_key =
            include_str!("./test_keys/rsa_pkcs8_unencrypted.pub").replace("testkey", "");
        let public_key = public_key.trim();
        let result = import_key(private_key.to_string(), "".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::Success);
        assert_eq!(result.ssh_key.unwrap().public_key, public_key);
    }

    // rsa pkcs8 encrypted is not supported yet
    #[test]
    fn import_key_rsa_pkcs8_encrypted_fails() {
        let private_key = include_str!("./test_keys/rsa_pkcs8_encrypted");
        let result = import_key(private_key.to_string(), "password".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::ParsingError);
    }

    #[test]
    fn import_key_ed25519_pkcs8_encrypted_wrong_password() {
        let private_key = include_str!("./test_keys/ed25519_pkcs8_encrypted");
        let result = import_key(private_key.to_string(), "wrongpassword".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::WrongPassword);
    }

    #[test]
    fn import_key_ed25519_openssh_encrypted_wrong_password() {
        let private_key = include_str!("./test_keys/ed25519_openssh_encrypted");
        let result = import_key(private_key.to_string(), "wrongpassword".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::WrongPassword);
    }

    #[test]
    fn import_key_rsa_openssh_encrypted_wrong_password() {
        let private_key = include_str!("./test_keys/rsa_openssh_encrypted");
        let result = import_key(private_key.to_string(), "wrongpassword".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::WrongPassword);
    }

    #[test]
    fn import_non_key_error() {
        let result = import_key("not a key".to_string(), "".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::ParsingError);
    }

    #[test]
    fn import_ecdsa_error() {
        let private_key = include_str!("./test_keys/ecdsa_openssh_unencrypted");
        let result = import_key(private_key.to_string(), "".to_string()).unwrap();
        assert_eq!(result.status, SshKeyImportStatus::ParsingError);
    }
}
