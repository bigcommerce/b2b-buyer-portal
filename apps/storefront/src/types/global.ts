export enum Environment {
  Production = 'production',
  Staging = 'staging',
  Integration = 'integration',
  Local = 'local',
}

export type EnvSpecificConfig<ValueType> = Record<Environment, ValueType>;

export type SimpleObject = Record<string, string | number | undefined | null>;

export interface Address {
  city: string;
  company: string;
  country: string;
  country_iso2: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  state: string;
  street_1: string;
  street_2: string;
  zip: string;
}

export interface ConfigsSwitchStatusProps {
  key: string;
  id: string;
  isEnabled: string;
}
