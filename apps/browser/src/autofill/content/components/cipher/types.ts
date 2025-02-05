export const NotificationCipherTypes = {
  Login: 1,
} as const;

type NotificationCipherType =
  (typeof NotificationCipherTypes)[keyof typeof NotificationCipherTypes];

export const CipherRepromptTypes = {
  None: 0,
  Password: 1,
} as const;

type CipherRepromptType = (typeof CipherRepromptTypes)[keyof typeof CipherRepromptTypes];

export type WebsiteIconData = {
  imageEnabled: boolean;
  image: string;
  fallbackImage: string;
  icon: string;
};

export type NotificationCipherData = {
  id: string;
  name: string;
  type: NotificationCipherType;
  reprompt: CipherRepromptType;
  favorite: boolean;
  icon: WebsiteIconData;
  login?: {
    username: string;
  };
};
