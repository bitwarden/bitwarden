import { OrganizationConnectionType } from "../admin-console/enums";
import { OrganizationSponsorshipCreateRequest } from "../admin-console/models/request/organization/organization-sponsorship-create.request";
import { OrganizationSponsorshipRedeemRequest } from "../admin-console/models/request/organization/organization-sponsorship-redeem.request";
import { OrganizationConnectionRequest } from "../admin-console/models/request/organization-connection.request";
import { ProviderAddOrganizationRequest } from "../admin-console/models/request/provider/provider-add-organization.request";
import { ProviderOrganizationCreateRequest } from "../admin-console/models/request/provider/provider-organization-create.request";
import { ProviderSetupRequest } from "../admin-console/models/request/provider/provider-setup.request";
import { ProviderUpdateRequest } from "../admin-console/models/request/provider/provider-update.request";
import { ProviderUserAcceptRequest } from "../admin-console/models/request/provider/provider-user-accept.request";
import { ProviderUserBulkConfirmRequest } from "../admin-console/models/request/provider/provider-user-bulk-confirm.request";
import { ProviderUserBulkRequest } from "../admin-console/models/request/provider/provider-user-bulk.request";
import { ProviderUserConfirmRequest } from "../admin-console/models/request/provider/provider-user-confirm.request";
import { ProviderUserInviteRequest } from "../admin-console/models/request/provider/provider-user-invite.request";
import { ProviderUserUpdateRequest } from "../admin-console/models/request/provider/provider-user-update.request";
import { SelectionReadOnlyRequest } from "../admin-console/models/request/selection-read-only.request";
import {
  OrganizationConnectionConfigApis,
  OrganizationConnectionResponse,
} from "../admin-console/models/response/organization-connection.response";
import { OrganizationExportResponse } from "../admin-console/models/response/organization-export.response";
import { OrganizationSponsorshipSyncStatusResponse } from "../admin-console/models/response/organization-sponsorship-sync-status.response";
import {
  ProviderOrganizationOrganizationDetailsResponse,
  ProviderOrganizationResponse,
} from "../admin-console/models/response/provider/provider-organization.response";
import { ProviderUserBulkPublicKeyResponse } from "../admin-console/models/response/provider/provider-user-bulk-public-key.response";
import { ProviderUserBulkResponse } from "../admin-console/models/response/provider/provider-user-bulk.response";
import {
  ProviderUserResponse,
  ProviderUserUserDetailsResponse,
} from "../admin-console/models/response/provider/provider-user.response";
import { ProviderResponse } from "../admin-console/models/response/provider/provider.response";
import { SelectionReadOnlyResponse } from "../admin-console/models/response/selection-read-only.response";
import { CreateAuthRequest } from "../auth/models/request/create-auth.request";
import { DeviceVerificationRequest } from "../auth/models/request/device-verification.request";
import { EmailTokenRequest } from "../auth/models/request/email-token.request";
import { EmailRequest } from "../auth/models/request/email.request";
import { PasswordTokenRequest } from "../auth/models/request/identity-token/password-token.request";
import { SsoTokenRequest } from "../auth/models/request/identity-token/sso-token.request";
import { UserApiTokenRequest } from "../auth/models/request/identity-token/user-api-token.request";
import { WebAuthnLoginTokenRequest } from "../auth/models/request/identity-token/webauthn-login-token.request";
import { KeyConnectorUserKeyRequest } from "../auth/models/request/key-connector-user-key.request";
import { PasswordHintRequest } from "../auth/models/request/password-hint.request";
import { PasswordRequest } from "../auth/models/request/password.request";
import { PasswordlessAuthRequest } from "../auth/models/request/passwordless-auth.request";
import { SecretVerificationRequest } from "../auth/models/request/secret-verification.request";
import { SetKeyConnectorKeyRequest } from "../auth/models/request/set-key-connector-key.request";
import { SetPasswordRequest } from "../auth/models/request/set-password.request";
import { TwoFactorEmailRequest } from "../auth/models/request/two-factor-email.request";
import { TwoFactorProviderRequest } from "../auth/models/request/two-factor-provider.request";
import { TwoFactorRecoveryRequest } from "../auth/models/request/two-factor-recovery.request";
import { UpdateProfileRequest } from "../auth/models/request/update-profile.request";
import { UpdateTempPasswordRequest } from "../auth/models/request/update-temp-password.request";
import { UpdateTwoFactorAuthenticatorRequest } from "../auth/models/request/update-two-factor-authenticator.request";
import { UpdateTwoFactorDuoRequest } from "../auth/models/request/update-two-factor-duo.request";
import { UpdateTwoFactorEmailRequest } from "../auth/models/request/update-two-factor-email.request";
import { UpdateTwoFactorWebAuthnDeleteRequest } from "../auth/models/request/update-two-factor-web-authn-delete.request";
import { UpdateTwoFactorWebAuthnRequest } from "../auth/models/request/update-two-factor-web-authn.request";
import { UpdateTwoFactorYubioOtpRequest } from "../auth/models/request/update-two-factor-yubio-otp.request";
import { ApiKeyResponse } from "../auth/models/response/api-key.response";
import { AuthRequestResponse } from "../auth/models/response/auth-request.response";
import { DeviceVerificationResponse } from "../auth/models/response/device-verification.response";
import { IdentityCaptchaResponse } from "../auth/models/response/identity-captcha.response";
import { IdentityTokenResponse } from "../auth/models/response/identity-token.response";
import { IdentityTwoFactorResponse } from "../auth/models/response/identity-two-factor.response";
import { KeyConnectorUserKeyResponse } from "../auth/models/response/key-connector-user-key.response";
import { MasterPasswordPolicyResponse } from "../auth/models/response/master-password-policy.response";
import { PreloginResponse } from "../auth/models/response/prelogin.response";
import { RegisterResponse } from "../auth/models/response/register.response";
import { SsoPreValidateResponse } from "../auth/models/response/sso-pre-validate.response";
import { TwoFactorAuthenticatorResponse } from "../auth/models/response/two-factor-authenticator.response";
import { TwoFactorDuoResponse } from "../auth/models/response/two-factor-duo.response";
import { TwoFactorEmailResponse } from "../auth/models/response/two-factor-email.response";
import { TwoFactorProviderResponse } from "../auth/models/response/two-factor-provider.response";
import { TwoFactorRecoverResponse } from "../auth/models/response/two-factor-recover.response";
import {
  ChallengeResponse,
  TwoFactorWebAuthnResponse,
} from "../auth/models/response/two-factor-web-authn.response";
import { TwoFactorYubiKeyResponse } from "../auth/models/response/two-factor-yubi-key.response";
import { BitPayInvoiceRequest } from "../billing/models/request/bit-pay-invoice.request";
import { PaymentRequest } from "../billing/models/request/payment.request";
import { TaxInfoUpdateRequest } from "../billing/models/request/tax-info-update.request";
import { BillingHistoryResponse } from "../billing/models/response/billing-history.response";
import { BillingPaymentResponse } from "../billing/models/response/billing-payment.response";
import { PaymentResponse } from "../billing/models/response/payment.response";
import { PlanResponse } from "../billing/models/response/plan.response";
import { SubscriptionResponse } from "../billing/models/response/subscription.response";
import { TaxInfoResponse } from "../billing/models/response/tax-info.response";
import { TaxRateResponse } from "../billing/models/response/tax-rate.response";
import { DeleteRecoverRequest } from "../models/request/delete-recover.request";
import { EventRequest } from "../models/request/event.request";
import { KdfRequest } from "../models/request/kdf.request";
import { KeysRequest } from "../models/request/keys.request";
import { OrganizationImportRequest } from "../models/request/organization-import.request";
import { PreloginRequest } from "../models/request/prelogin.request";
import { RegisterRequest } from "../models/request/register.request";
import { StorageRequest } from "../models/request/storage.request";
import { UpdateAvatarRequest } from "../models/request/update-avatar.request";
import { UpdateDomainsRequest } from "../models/request/update-domains.request";
import { VerifyDeleteRecoverRequest } from "../models/request/verify-delete-recover.request";
import { VerifyEmailRequest } from "../models/request/verify-email.request";
import { BreachAccountResponse } from "../models/response/breach-account.response";
import { DomainsResponse } from "../models/response/domains.response";
import { EventResponse } from "../models/response/event.response";
import { ListResponse } from "../models/response/list.response";
import { ProfileResponse } from "../models/response/profile.response";
import { UserKeyResponse } from "../models/response/user-key.response";
import { AttachmentRequest } from "../vault/models/request/attachment.request";
import { CipherBulkDeleteRequest } from "../vault/models/request/cipher-bulk-delete.request";
import { CipherBulkMoveRequest } from "../vault/models/request/cipher-bulk-move.request";
import { CipherBulkRestoreRequest } from "../vault/models/request/cipher-bulk-restore.request";
import { CipherBulkShareRequest } from "../vault/models/request/cipher-bulk-share.request";
import { CipherCollectionsRequest } from "../vault/models/request/cipher-collections.request";
import { CipherCreateRequest } from "../vault/models/request/cipher-create.request";
import { CipherPartialRequest } from "../vault/models/request/cipher-partial.request";
import { CipherShareRequest } from "../vault/models/request/cipher-share.request";
import { CipherRequest } from "../vault/models/request/cipher.request";
import { CollectionRequest } from "../vault/models/request/collection.request";
import { AttachmentUploadDataResponse } from "../vault/models/response/attachment-upload-data.response";
import { AttachmentResponse } from "../vault/models/response/attachment.response";
import { CipherResponse } from "../vault/models/response/cipher.response";
import {
  CollectionAccessDetailsResponse,
  CollectionDetailsResponse,
  CollectionResponse,
} from "../vault/models/response/collection.response";
import { SyncResponse } from "../vault/models/response/sync.response";

/**
 * @deprecated The `ApiService` class is deprecated and calls should be extracted into individual
 * api services. The `send` method is still allowed to be used within api services. For background
 * of this decision please read https://contributing.bitwarden.com/architecture/adr/refactor-api-service.
 */
export abstract class ApiService {
  abstract send(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body: any,
    authed: boolean,
    hasResponse: boolean,
    apiUrl?: string,
    alterHeaders?: (headers: Headers) => void,
  ): Promise<any>;

  abstract postIdentityToken(
    request:
      | PasswordTokenRequest
      | SsoTokenRequest
      | UserApiTokenRequest
      | WebAuthnLoginTokenRequest,
  ): Promise<IdentityTokenResponse | IdentityTwoFactorResponse | IdentityCaptchaResponse>;
  abstract refreshIdentityToken(): Promise<any>;

  abstract getProfile(): Promise<ProfileResponse>;
  abstract getUserSubscription(): Promise<SubscriptionResponse>;
  abstract getTaxInfo(): Promise<TaxInfoResponse>;
  abstract putProfile(request: UpdateProfileRequest): Promise<ProfileResponse>;
  abstract putAvatar(request: UpdateAvatarRequest): Promise<ProfileResponse>;
  abstract putTaxInfo(request: TaxInfoUpdateRequest): Promise<any>;
  abstract postPrelogin(request: PreloginRequest): Promise<PreloginResponse>;
  abstract postEmailToken(request: EmailTokenRequest): Promise<any>;
  abstract postEmail(request: EmailRequest): Promise<any>;
  abstract postPassword(request: PasswordRequest): Promise<any>;
  abstract setPassword(request: SetPasswordRequest): Promise<any>;
  abstract postSetKeyConnectorKey(request: SetKeyConnectorKeyRequest): Promise<any>;
  abstract postSecurityStamp(request: SecretVerificationRequest): Promise<any>;
  abstract getAccountRevisionDate(): Promise<number>;
  abstract postPasswordHint(request: PasswordHintRequest): Promise<any>;
  abstract postRegister(request: RegisterRequest): Promise<RegisterResponse>;
  abstract postPremium(data: FormData): Promise<PaymentResponse>;
  abstract postReinstatePremium(): Promise<any>;
  abstract postCancelPremium(): Promise<any>;
  abstract postAccountStorage(request: StorageRequest): Promise<PaymentResponse>;
  abstract postAccountPayment(request: PaymentRequest): Promise<void>;
  abstract postAccountLicense(data: FormData): Promise<any>;
  abstract postAccountKeys(request: KeysRequest): Promise<any>;
  abstract postAccountVerifyEmail(): Promise<any>;
  abstract postAccountVerifyEmailToken(request: VerifyEmailRequest): Promise<any>;
  abstract postAccountVerifyPassword(
    request: SecretVerificationRequest,
  ): Promise<MasterPasswordPolicyResponse>;
  abstract postAccountRecoverDelete(request: DeleteRecoverRequest): Promise<any>;
  abstract postAccountRecoverDeleteToken(request: VerifyDeleteRecoverRequest): Promise<any>;
  abstract postAccountKdf(request: KdfRequest): Promise<any>;
  abstract postUserApiKey(id: string, request: SecretVerificationRequest): Promise<ApiKeyResponse>;
  abstract postUserRotateApiKey(
    id: string,
    request: SecretVerificationRequest,
  ): Promise<ApiKeyResponse>;
  abstract putUpdateTempPassword(request: UpdateTempPasswordRequest): Promise<any>;
  abstract postConvertToKeyConnector(): Promise<void>;
  //passwordless
  abstract postAuthRequest(request: CreateAuthRequest): Promise<AuthRequestResponse>;
  abstract postAdminAuthRequest(request: CreateAuthRequest): Promise<AuthRequestResponse>;
  abstract getAuthResponse(id: string, accessCode: string): Promise<AuthRequestResponse>;
  abstract getAuthRequest(id: string): Promise<AuthRequestResponse>;
  abstract putAuthRequest(
    id: string,
    request: PasswordlessAuthRequest,
  ): Promise<AuthRequestResponse>;
  abstract getAuthRequests(): Promise<ListResponse<AuthRequestResponse>>;
  abstract getLastAuthRequest(): Promise<AuthRequestResponse>;

  abstract getUserBillingHistory(): Promise<BillingHistoryResponse>;
  abstract getUserBillingPayment(): Promise<BillingPaymentResponse>;

  abstract getCipher(id: string): Promise<CipherResponse>;
  abstract getFullCipherDetails(id: string): Promise<CipherResponse>;
  abstract getCipherAdmin(id: string): Promise<CipherResponse>;
  abstract getAttachmentData(
    cipherId: string,
    attachmentId: string,
    emergencyAccessId?: string,
  ): Promise<AttachmentResponse>;
  abstract getCiphersOrganization(organizationId: string): Promise<ListResponse<CipherResponse>>;
  abstract postCipher(request: CipherRequest): Promise<CipherResponse>;
  abstract postCipherCreate(request: CipherCreateRequest): Promise<CipherResponse>;
  abstract postCipherAdmin(request: CipherCreateRequest): Promise<CipherResponse>;
  abstract putCipher(id: string, request: CipherRequest): Promise<CipherResponse>;
  abstract putPartialCipher(id: string, request: CipherPartialRequest): Promise<CipherResponse>;
  abstract putCipherAdmin(id: string, request: CipherRequest): Promise<CipherResponse>;
  abstract deleteCipher(id: string): Promise<any>;
  abstract deleteCipherAdmin(id: string): Promise<any>;
  abstract deleteManyCiphers(request: CipherBulkDeleteRequest): Promise<any>;
  abstract deleteManyCiphersAdmin(request: CipherBulkDeleteRequest): Promise<any>;
  abstract putMoveCiphers(request: CipherBulkMoveRequest): Promise<any>;
  abstract putShareCipher(id: string, request: CipherShareRequest): Promise<CipherResponse>;
  abstract putShareCiphers(request: CipherBulkShareRequest): Promise<any>;
  abstract putCipherCollections(id: string, request: CipherCollectionsRequest): Promise<any>;
  abstract putCipherCollectionsAdmin(id: string, request: CipherCollectionsRequest): Promise<any>;
  abstract postPurgeCiphers(
    request: SecretVerificationRequest,
    organizationId?: string,
  ): Promise<any>;
  abstract putDeleteCipher(id: string): Promise<any>;
  abstract putDeleteCipherAdmin(id: string): Promise<any>;
  abstract putDeleteManyCiphers(request: CipherBulkDeleteRequest): Promise<any>;
  abstract putDeleteManyCiphersAdmin(request: CipherBulkDeleteRequest): Promise<any>;
  abstract putRestoreCipher(id: string): Promise<CipherResponse>;
  abstract putRestoreCipherAdmin(id: string): Promise<CipherResponse>;
  abstract putRestoreManyCiphers(
    request: CipherBulkRestoreRequest,
  ): Promise<ListResponse<CipherResponse>>;
  abstract putRestoreManyCiphersAdmin(
    request: CipherBulkRestoreRequest,
  ): Promise<ListResponse<CipherResponse>>;

  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  abstract postCipherAttachmentLegacy(id: string, data: FormData): Promise<CipherResponse>;
  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  abstract postCipherAttachmentAdminLegacy(id: string, data: FormData): Promise<CipherResponse>;
  abstract postCipherAttachment(
    id: string,
    request: AttachmentRequest,
  ): Promise<AttachmentUploadDataResponse>;
  abstract deleteCipherAttachment(id: string, attachmentId: string): Promise<any>;
  abstract deleteCipherAttachmentAdmin(id: string, attachmentId: string): Promise<any>;
  abstract postShareCipherAttachment(
    id: string,
    attachmentId: string,
    data: FormData,
    organizationId: string,
  ): Promise<any>;
  abstract renewAttachmentUploadUrl(
    id: string,
    attachmentId: string,
  ): Promise<AttachmentUploadDataResponse>;
  abstract postAttachmentFile(id: string, attachmentId: string, data: FormData): Promise<any>;

  abstract getUserCollections(): Promise<ListResponse<CollectionResponse>>;
  abstract getCollections(organizationId: string): Promise<ListResponse<CollectionResponse>>;
  abstract getCollectionUsers(
    organizationId: string,
    id: string,
  ): Promise<SelectionReadOnlyResponse[]>;
  abstract getCollectionAccessDetails(
    organizationId: string,
    id: string,
  ): Promise<CollectionAccessDetailsResponse>;
  abstract getManyCollectionsWithAccessDetails(
    orgId: string,
  ): Promise<ListResponse<CollectionAccessDetailsResponse>>;
  abstract postCollection(
    organizationId: string,
    request: CollectionRequest,
  ): Promise<CollectionDetailsResponse>;
  abstract putCollectionUsers(
    organizationId: string,
    id: string,
    request: SelectionReadOnlyRequest[],
  ): Promise<any>;
  abstract putCollection(
    organizationId: string,
    id: string,
    request: CollectionRequest,
  ): Promise<CollectionDetailsResponse>;
  abstract deleteCollection(organizationId: string, id: string): Promise<any>;
  abstract deleteManyCollections(organizationId: string, collectionIds: string[]): Promise<any>;
  abstract deleteCollectionUser(
    organizationId: string,
    id: string,
    organizationUserId: string,
  ): Promise<any>;

  abstract getGroupUsers(organizationId: string, id: string): Promise<string[]>;
  abstract putGroupUsers(organizationId: string, id: string, request: string[]): Promise<any>;
  abstract deleteGroupUser(
    organizationId: string,
    id: string,
    organizationUserId: string,
  ): Promise<any>;

  abstract getSync(): Promise<SyncResponse>;
  abstract postPublicImportDirectory(request: OrganizationImportRequest): Promise<any>;

  abstract getSettingsDomains(): Promise<DomainsResponse>;
  abstract putSettingsDomains(request: UpdateDomainsRequest): Promise<DomainsResponse>;

  abstract getTwoFactorProviders(): Promise<ListResponse<TwoFactorProviderResponse>>;
  abstract getTwoFactorOrganizationProviders(
    organizationId: string,
  ): Promise<ListResponse<TwoFactorProviderResponse>>;
  abstract getTwoFactorAuthenticator(
    request: SecretVerificationRequest,
  ): Promise<TwoFactorAuthenticatorResponse>;
  abstract getTwoFactorEmail(request: SecretVerificationRequest): Promise<TwoFactorEmailResponse>;
  abstract getTwoFactorDuo(request: SecretVerificationRequest): Promise<TwoFactorDuoResponse>;
  abstract getTwoFactorOrganizationDuo(
    organizationId: string,
    request: SecretVerificationRequest,
  ): Promise<TwoFactorDuoResponse>;
  abstract getTwoFactorYubiKey(
    request: SecretVerificationRequest,
  ): Promise<TwoFactorYubiKeyResponse>;
  abstract getTwoFactorWebAuthn(
    request: SecretVerificationRequest,
  ): Promise<TwoFactorWebAuthnResponse>;
  abstract getTwoFactorWebAuthnChallenge(
    request: SecretVerificationRequest,
  ): Promise<ChallengeResponse>;
  abstract getTwoFactorRecover(
    request: SecretVerificationRequest,
  ): Promise<TwoFactorRecoverResponse>;
  abstract putTwoFactorAuthenticator(
    request: UpdateTwoFactorAuthenticatorRequest,
  ): Promise<TwoFactorAuthenticatorResponse>;
  abstract putTwoFactorEmail(request: UpdateTwoFactorEmailRequest): Promise<TwoFactorEmailResponse>;
  abstract putTwoFactorDuo(request: UpdateTwoFactorDuoRequest): Promise<TwoFactorDuoResponse>;
  abstract putTwoFactorOrganizationDuo(
    organizationId: string,
    request: UpdateTwoFactorDuoRequest,
  ): Promise<TwoFactorDuoResponse>;
  abstract putTwoFactorYubiKey(
    request: UpdateTwoFactorYubioOtpRequest,
  ): Promise<TwoFactorYubiKeyResponse>;
  abstract putTwoFactorWebAuthn(
    request: UpdateTwoFactorWebAuthnRequest,
  ): Promise<TwoFactorWebAuthnResponse>;
  abstract deleteTwoFactorWebAuthn(
    request: UpdateTwoFactorWebAuthnDeleteRequest,
  ): Promise<TwoFactorWebAuthnResponse>;
  abstract putTwoFactorDisable(
    request: TwoFactorProviderRequest,
  ): Promise<TwoFactorProviderResponse>;
  abstract putTwoFactorOrganizationDisable(
    organizationId: string,
    request: TwoFactorProviderRequest,
  ): Promise<TwoFactorProviderResponse>;
  abstract postTwoFactorRecover(request: TwoFactorRecoveryRequest): Promise<any>;
  abstract postTwoFactorEmailSetup(request: TwoFactorEmailRequest): Promise<any>;
  abstract postTwoFactorEmail(request: TwoFactorEmailRequest): Promise<any>;
  abstract getDeviceVerificationSettings(): Promise<DeviceVerificationResponse>;
  abstract putDeviceVerificationSettings(
    request: DeviceVerificationRequest,
  ): Promise<DeviceVerificationResponse>;

  abstract getCloudCommunicationsEnabled(): Promise<boolean>;
  abstract getOrganizationConnection<TConfig extends OrganizationConnectionConfigApis>(
    id: string,
    type: OrganizationConnectionType,
    configType: { new (response: any): TConfig },
  ): Promise<OrganizationConnectionResponse<TConfig>>;
  abstract createOrganizationConnection<TConfig extends OrganizationConnectionConfigApis>(
    request: OrganizationConnectionRequest,
    configType: { new (response: any): TConfig },
  ): Promise<OrganizationConnectionResponse<TConfig>>;
  abstract updateOrganizationConnection<TConfig extends OrganizationConnectionConfigApis>(
    request: OrganizationConnectionRequest,
    configType: { new (response: any): TConfig },
    organizationConnectionId: string,
  ): Promise<OrganizationConnectionResponse<TConfig>>;
  abstract deleteOrganizationConnection(id: string): Promise<void>;
  abstract getPlans(): Promise<ListResponse<PlanResponse>>;
  abstract getTaxRates(): Promise<ListResponse<TaxRateResponse>>;

  abstract postProviderSetup(id: string, request: ProviderSetupRequest): Promise<ProviderResponse>;
  abstract getProvider(id: string): Promise<ProviderResponse>;
  abstract putProvider(id: string, request: ProviderUpdateRequest): Promise<ProviderResponse>;

  abstract getProviderUsers(
    providerId: string,
  ): Promise<ListResponse<ProviderUserUserDetailsResponse>>;
  abstract getProviderUser(providerId: string, id: string): Promise<ProviderUserResponse>;
  abstract postProviderUserInvite(
    providerId: string,
    request: ProviderUserInviteRequest,
  ): Promise<any>;
  abstract postProviderUserReinvite(providerId: string, id: string): Promise<any>;
  abstract postManyProviderUserReinvite(
    providerId: string,
    request: ProviderUserBulkRequest,
  ): Promise<ListResponse<ProviderUserBulkResponse>>;
  abstract postProviderUserAccept(
    providerId: string,
    id: string,
    request: ProviderUserAcceptRequest,
  ): Promise<any>;
  abstract postProviderUserConfirm(
    providerId: string,
    id: string,
    request: ProviderUserConfirmRequest,
  ): Promise<any>;
  abstract postProviderUsersPublicKey(
    providerId: string,
    request: ProviderUserBulkRequest,
  ): Promise<ListResponse<ProviderUserBulkPublicKeyResponse>>;
  abstract postProviderUserBulkConfirm(
    providerId: string,
    request: ProviderUserBulkConfirmRequest,
  ): Promise<ListResponse<ProviderUserBulkResponse>>;
  abstract putProviderUser(
    providerId: string,
    id: string,
    request: ProviderUserUpdateRequest,
  ): Promise<any>;
  abstract deleteProviderUser(organizationId: string, id: string): Promise<any>;
  abstract deleteManyProviderUsers(
    providerId: string,
    request: ProviderUserBulkRequest,
  ): Promise<ListResponse<ProviderUserBulkResponse>>;
  abstract getProviderClients(
    providerId: string,
  ): Promise<ListResponse<ProviderOrganizationOrganizationDetailsResponse>>;
  abstract postProviderAddOrganization(
    providerId: string,
    request: ProviderAddOrganizationRequest,
  ): Promise<any>;
  abstract postProviderCreateOrganization(
    providerId: string,
    request: ProviderOrganizationCreateRequest,
  ): Promise<ProviderOrganizationResponse>;
  abstract deleteProviderOrganization(providerId: string, organizationId: string): Promise<any>;

  abstract getEvents(
    start: string,
    end: string,
    token: string,
  ): Promise<ListResponse<EventResponse>>;
  abstract getEventsCipher(
    id: string,
    start: string,
    end: string,
    token: string,
  ): Promise<ListResponse<EventResponse>>;
  abstract getEventsOrganization(
    id: string,
    start: string,
    end: string,
    token: string,
  ): Promise<ListResponse<EventResponse>>;
  abstract getEventsOrganizationUser(
    organizationId: string,
    id: string,
    start: string,
    end: string,
    token: string,
  ): Promise<ListResponse<EventResponse>>;
  abstract getEventsProvider(
    id: string,
    start: string,
    end: string,
    token: string,
  ): Promise<ListResponse<EventResponse>>;
  abstract getEventsProviderUser(
    providerId: string,
    id: string,
    start: string,
    end: string,
    token: string,
  ): Promise<ListResponse<EventResponse>>;
  abstract postEventsCollect(request: EventRequest[]): Promise<any>;

  abstract deleteSsoUser(organizationId: string): Promise<void>;
  abstract getSsoUserIdentifier(): Promise<string>;

  abstract getUserPublicKey(id: string): Promise<UserKeyResponse>;

  abstract getHibpBreach(username: string): Promise<BreachAccountResponse[]>;

  abstract postBitPayInvoice(request: BitPayInvoiceRequest): Promise<string>;
  abstract postSetupPayment(): Promise<string>;

  abstract getActiveBearerToken(): Promise<string>;
  abstract fetch(request: Request): Promise<Response>;
  abstract nativeFetch(request: Request): Promise<Response>;

  abstract preValidateSso(identifier: string): Promise<SsoPreValidateResponse>;

  abstract postCreateSponsorship(
    sponsorshipOrgId: string,
    request: OrganizationSponsorshipCreateRequest,
  ): Promise<void>;
  abstract getSponsorshipSyncStatus(
    sponsoredOrgId: string,
  ): Promise<OrganizationSponsorshipSyncStatusResponse>;
  abstract deleteRevokeSponsorship(sponsoringOrganizationId: string): Promise<void>;
  abstract deleteRemoveSponsorship(sponsoringOrgId: string): Promise<void>;
  abstract postPreValidateSponsorshipToken(sponsorshipToken: string): Promise<boolean>;
  abstract postRedeemSponsorship(
    sponsorshipToken: string,
    request: OrganizationSponsorshipRedeemRequest,
  ): Promise<void>;
  abstract postResendSponsorshipOffer(sponsoringOrgId: string): Promise<void>;

  abstract getMasterKeyFromKeyConnector(
    keyConnectorUrl: string,
  ): Promise<KeyConnectorUserKeyResponse>;
  abstract postUserKeyToKeyConnector(
    keyConnectorUrl: string,
    request: KeyConnectorUserKeyRequest,
  ): Promise<void>;
  abstract getKeyConnectorAlive(keyConnectorUrl: string): Promise<void>;
  abstract getOrganizationExport(organizationId: string): Promise<OrganizationExportResponse>;
}
