// eslint-disable-next-line no-restricted-imports
import { mock, mockReset } from "jest-mock-extended";

import { ApiService } from "../../abstractions/api.service";
import { SearchService } from "../../abstractions/search.service";
import { SettingsService } from "../../abstractions/settings.service";
import { UriMatchType , FieldType } from "../../enums";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { EncryptService } from "../../platform/abstractions/encrypt.service";
import { I18nService } from "../../platform/abstractions/i18n.service";
import { StateService } from "../../platform/abstractions/state.service";
import { EncArrayBuffer } from "../../platform/models/domain/enc-array-buffer";
import { EncString } from "../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../platform/models/domain/symmetric-crypto-key";
import { CipherFileUploadService } from "../abstractions/file-upload/cipher-file-upload.service";
import { CipherRepromptType } from "../enums/cipher-reprompt-type";
import { CipherType } from "../enums/cipher-type";
import { CipherData } from "../models/data/cipher.data";
import { Cipher } from "../models/domain/cipher";
import { CipherCreateRequest } from "../models/request/cipher-create.request";
import { CipherRequest } from "../models/request/cipher.request";

import { CipherService } from "./cipher.service";

const ENCRYPTED_TEXT = "This data has been encrypted";
const ENCRYPTED_BYTES = mock<EncArrayBuffer>();

const cipherData: CipherData = {
  id: "id",
  organizationId: "orgId",
  folderId: "folderId",
  edit: true,
  viewPassword: true,
  organizationUseTotp: true,
  favorite: false,
  revisionDate: "2022-01-31T12:00:00.000Z",
  type: CipherType.Login,
  name: "EncryptedString",
  notes: "EncryptedString",
  creationDate: "2022-01-01T12:00:00.000Z",
  deletedDate: null,
  reprompt: CipherRepromptType.None,
  login: {
    uris: [{ uri: "EncryptedString", match: UriMatchType.Domain }],
    username: "EncryptedString",
    password: "EncryptedString",
    passwordRevisionDate: "2022-01-31T12:00:00.000Z",
    totp: "EncryptedString",
    autofillOnPageLoad: false,
  },
  passwordHistory: [{ password: "EncryptedString", lastUsedDate: "2022-01-31T12:00:00.000Z" }],
  attachments: [
    {
      id: "a1",
      url: "url",
      size: "1100",
      sizeName: "1.1 KB",
      fileName: "file",
      key: "EncKey",
    },
    {
      id: "a2",
      url: "url",
      size: "1100",
      sizeName: "1.1 KB",
      fileName: "file",
      key: "EncKey",
    },
  ],
  fields: [
    {
      name: "EncryptedString",
      value: "EncryptedString",
      type: FieldType.Text,
      linkedId: null,
    },
    {
      name: "EncryptedString",
      value: "EncryptedString",
      type: FieldType.Hidden,
      linkedId: null,
    },
  ],
};

describe("Cipher Service", () => {
  const cryptoService = mock<CryptoService>();
  const stateService = mock<StateService>();
  const settingsService = mock<SettingsService>();
  const apiService = mock<ApiService>();
  const cipherFileUploadService = mock<CipherFileUploadService>();
  const i18nService = mock<I18nService>();
  const searchService = mock<SearchService>();
  const encryptService = mock<EncryptService>();

  let cipherService: CipherService;
  let cipherObj: Cipher;

  beforeEach(() => {
    mockReset(apiService);
    mockReset(cryptoService);
    mockReset(stateService);
    mockReset(settingsService);
    mockReset(cipherFileUploadService);
    mockReset(i18nService);
    mockReset(searchService);
    mockReset(encryptService);

    cryptoService.encryptToBytes.mockReturnValue(ENCRYPTED_BYTES);
    cryptoService.encrypt.mockReturnValue(new EncString(ENCRYPTED_TEXT));

    cipherService = new CipherService(
      cryptoService,
      settingsService,
      apiService,
      i18nService,
      searchService,
      stateService,
      encryptService,
      cipherFileUploadService
    );

    cipherObj = new Cipher(cipherData);
  });

  it("should upload encrypted file contents with save attachments", async () => {
    const fileName = "filename";
    const fileData = new Uint8Array(10).buffer;
    cryptoService.getOrgKey.mockReturnValue(new SymmetricCryptoKey(new Uint8Array(32).buffer));
    cryptoService.makeEncKey.mockReturnValue(new SymmetricCryptoKey(new Uint8Array(32).buffer));
    const spy = jest.spyOn(cipherFileUploadService, "upload");

    await cipherService.saveAttachmentRawWithServer(new Cipher(), fileName, fileData);

    expect(spy).toHaveBeenCalled();
  });

  it("should call apiService.postCipherAdmin when orgAdmin param is true", async () => {
    const spy = jest.spyOn(apiService, "postCipherAdmin").mockImplementation(() => cipherObj);
    cipherService.createWithServer(cipherObj, true);
    const expectedObj = new CipherCreateRequest(cipherObj);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expectedObj);
  });

  it("should call apiService.postCipherCreate if collectionsIds != null", async () => {
    cipherObj.collectionIds = ["123"];
    const spy = jest.spyOn(apiService, "postCipherCreate").mockImplementation(() => cipherObj);
    cipherService.createWithServer(cipherObj);
    const expectedObj = new CipherCreateRequest(cipherObj);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expectedObj);
  });

  it("should call apiService.postCipher when orgAdmin and collectionIds logic is false", async () => {
    const spy = jest.spyOn(apiService, "postCipher").mockImplementation(() => cipherObj);
    cipherService.createWithServer(cipherObj);
    const expectedObj = new CipherRequest(cipherObj);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expectedObj);
  });
});
