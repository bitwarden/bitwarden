import { EnpassJsonFile } from "@bitwarden/common/importers/enpass/types/enpass-json-type";

export const creditCard: EnpassJsonFile = {
  folders: [],
  items: [
    {
      archived: 0,
      auto_submit: 1,
      category: "creditcard",
      createdAt: 1666449561,
      favorite: 1,
      fields: [
        {
          deleted: 0,
          history: [
            {
              updated_at: 1534490234,
              value: "Wendy Apple Seed",
            },
            {
              updated_at: 1535521811,
              value: "Emma",
            },
            {
              updated_at: 1535522090,
              value: "Emily",
            },
          ],
          label: "Cardholder",
          order: 1,
          sensitive: 0,
          type: "ccName",
          uid: 0,
          updated_at: 1666449561,
          value: "Emily Sample",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Type",
          order: 2,
          sensitive: 0,
          type: "ccType",
          uid: 17,
          updated_at: 1666449561,
          value: "American Express",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          history: [
            {
              updated_at: 1534490234,
              value: "1234 1234 5678 0000",
            },
          ],
          label: "Number",
          order: 3,
          sensitive: 0,
          type: "ccNumber",
          uid: 1,
          updated_at: 1666449561,
          value: "3782 822463 10005",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "CVC",
          order: 4,
          sensitive: 1,
          type: "ccCvc",
          uid: 2,
          updated_at: 1666449561,
          value: "1234",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "PIN",
          order: 5,
          sensitive: 1,
          type: "ccPin",
          uid: 3,
          updated_at: 1666449561,
          value: "9874",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Expiry date",
          order: 6,
          sensitive: 0,
          type: "ccExpiry",
          uid: 4,
          updated_at: 1666449561,
          value: "03/23",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "INTERNET BANKING",
          order: 7,
          sensitive: 0,
          type: "section",
          uid: 103,
          updated_at: 1666449561,
          value: "",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          history: [
            {
              updated_at: 1534490234,
              value: "WendySeed",
            },
            {
              updated_at: 1535521811,
              value: "Emma1",
            },
            {
              updated_at: 1535522182,
              value: "Emily1",
            },
          ],
          label: "Username",
          order: 8,
          sensitive: 0,
          type: "username",
          uid: 15,
          updated_at: 1666449561,
          value: "Emily_ENP",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Login password",
          order: 9,
          sensitive: 1,
          type: "password",
          uid: 16,
          updated_at: 1666449561,
          value: "nnn tug shoot selfish bon liars convent dusty minnow uncheck",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Transaction password",
          order: 10,
          sensitive: 1,
          type: "ccTxnpassword",
          uid: 9,
          updated_at: 1666449561,
          value: "",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Website",
          order: 11,
          sensitive: 0,
          type: "url",
          uid: 14,
          updated_at: 1666449561,
          value: "http://global.americanexpress.com/",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "ADDITIONAL DETAILS",
          order: 12,
          sensitive: 0,
          type: "section",
          uid: 104,
          updated_at: 1666449561,
          value: "",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Issuing bank",
          order: 13,
          sensitive: 0,
          type: "ccBankname",
          uid: 6,
          updated_at: 1666449561,
          value: "American Express",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Issued on",
          order: 14,
          sensitive: 0,
          type: "date",
          uid: 7,
          updated_at: 1666449561,
          value: "",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Valid from",
          order: 15,
          sensitive: 0,
          type: "ccValidfrom",
          uid: 18,
          updated_at: 1666449561,
          value: "",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Credit limit",
          order: 16,
          sensitive: 0,
          type: "numeric",
          uid: 10,
          updated_at: 1666449561,
          value: "100000",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Withdrawal limit",
          order: 17,
          sensitive: 0,
          type: "numeric",
          uid: 11,
          updated_at: 1666449561,
          value: "50000",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "Interest rate",
          order: 18,
          sensitive: 0,
          type: "numeric",
          uid: 12,
          updated_at: 1666449561,
          value: "1.5",
          value_updated_at: 1666449561,
        },
        {
          deleted: 0,
          label: "If lost, call",
          order: 19,
          sensitive: 0,
          type: "phone",
          uid: 8,
          updated_at: 1666449561,
          value: "12345678",
          value_updated_at: 1666449561,
        },
      ],
      icon: {
        fav: "global.americanexpress.com",
        image: {
          file: "cc/american_express",
        },
        type: 2,
        uuid: "",
      },
      note: "some notes on the credit card",
      subtitle: "***** 0000",
      template_type: "creditcard.default",
      title: "Emily Sample Credit Card",
      trashed: 0,
      updated_at: 1666554351,
      uuid: "dbbc741b-81d6-491a-9660-92995fd8958c",
    },
  ],
};
