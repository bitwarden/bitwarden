import { ScimProviderType } from "@bitwarden/common/enums/scimProviderType";

import { BaseResponse } from "../response/baseResponse";

export class ScimConfigApi extends BaseResponse {
  enabled: boolean;
  scimProvider: ScimProviderType;
  serviceUrl: string;

  constructor(data: any) {
    super(data);
    if (data == null) {
      return;
    }
    this.enabled = this.getResponseProperty("Enabled");
    this.scimProvider = this.getResponseProperty("ScimProvider");
    this.serviceUrl = this.getResponseProperty("ServiceUrl");
  }
}
