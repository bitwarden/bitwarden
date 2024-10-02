/** Types of passwords that may be generated by the credential generator */
export const PasswordAlgorithms = Object.freeze(["password", "passphrase"] as const);

/** Types of usernames that may be generated by the credential generator */
export const UsernameAlgorithms = Object.freeze(["username"] as const);

/** Types of email addresses that may be generated by the credential generator */
export const EmailAlgorithms = Object.freeze(["catchall", "forwarder", "subaddress"] as const);

/** All types of credentials that may be generated by the credential generator */
export const CredentialAlgorithms = Object.freeze([
  ...PasswordAlgorithms,
  ...UsernameAlgorithms,
  ...EmailAlgorithms,
] as const);
