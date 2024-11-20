import { TaxInfoResponse } from "@bitwarden/common/billing/models/response/tax-info.response";

export class TaxInformation {
  country: string;
  postalCode: string;
  taxId: string;
  taxIdType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;

  static empty(): TaxInformation {
    return {
      country: null,
      postalCode: null,
      taxId: null,
      taxIdType: null,
      line1: null,
      line2: null,
      city: null,
      state: null,
    };
  }

  static from(response: TaxInfoResponse | null): TaxInformation {
    if (response === null) {
      return TaxInformation.empty();
    }
    return {
      ...response,
    };
  }
}
