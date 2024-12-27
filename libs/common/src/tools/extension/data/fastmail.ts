import { Field, Vendor } from "../metadata/data";
import { Extension } from "../metadata/extension";
import { ExtensionMetadata } from "../metadata/type";

export const Fastmail = {
  id: Vendor.fastmail,
  name: "Fastmail",
};

export const FastmailExtensions: ExtensionMetadata[] = [
  {
    site: Extension.forwarder,
    product: {
      vendor: Fastmail,
    },
    host: {
      authorization: "bearer",
      selfHost: "maybe",
      baseUrl: "https://api.fastmail.com",
    },
    requestedFields: [Field.token],
  },
];
