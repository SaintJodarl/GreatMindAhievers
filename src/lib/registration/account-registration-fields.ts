export const ACCOUNT_REGISTRATION_SECTIONS = {
  account: '1. Account Information',
  kyc: '2. KYC Information',
  codes: '3. Codes',
} as const;

export const NIGERIAN_BANKS = [
  'Access Bank',
  'Fidelity Bank',
  'First City Monument Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Holding Company',
  'Union Bank of Nigeria',
  'United Bank for Africa',
  'Zenith Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Heritage Bank',
  'Keystone Bank',
  'Optimus Bank',
  'Polaris Bank',
  'PremiumTrust Bank',
  'Providus Bank',
  'Signature Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'Titan Trust Bank',
  'Unity Bank',
  'Wema Bank',
  'Globus Bank',
  'Parallex Bank',
  'Premium Trust Bank',
  'Jaiz Bank',
  'Lotus Bank',
  'TAJBank',
  'Opay',
  'Moniepoint',
  'Palmpay',
  'Kuda Bank',
] as const;

type AccountRegistrationSection = keyof typeof ACCOUNT_REGISTRATION_SECTIONS;

type AccountRegistrationFieldDefinition = {
  label: string;
  section: AccountRegistrationSection;
  exportable: boolean;
  persisted: boolean;
  sensitive?: boolean;
  prismaSource?: string;
  placeholder?: string;
};

export const ACCOUNT_REGISTRATION_FIELDS = {
  firstName: {
    label: 'First Name',
    section: 'account',
    exportable: true,
    persisted: true,
    prismaSource: 'MemberProfile.firstName (KYCSubmission.fullName/User.name fallback)',
  },
  lastName: {
    label: 'Last Name',
    section: 'account',
    exportable: true,
    persisted: true,
    prismaSource: 'MemberProfile.lastName (KYCSubmission.fullName/User.name fallback)',
  },
  username: {
    label: 'Username',
    section: 'account',
    exportable: true,
    persisted: true,
    prismaSource: 'User.username',
  },
  phone: {
    label: 'Phone',
    section: 'account',
    exportable: true,
    persisted: true,
    prismaSource: 'MemberProfile.phone (KYCSubmission.phone fallback)',
  },
  email: {
    label: 'Email Address',
    section: 'account',
    exportable: true,
    persisted: true,
    prismaSource: 'User.email',
  },
  password: {
    label: 'Password',
    section: 'account',
    exportable: false,
    persisted: true,
    sensitive: true,
    prismaSource: 'User.password',
  },
  confirmPassword: {
    label: 'Confirm',
    section: 'account',
    exportable: false,
    persisted: false,
    sensitive: true,
  },
  gender: {
    label: 'Gender',
    section: 'kyc',
    exportable: true,
    persisted: true,
    prismaSource: 'MemberProfile.gender (KYCSubmission.gender fallback)',
    placeholder: 'Select Gender',
  },
  state: {
    label: 'State',
    section: 'kyc',
    exportable: true,
    persisted: true,
    prismaSource: 'MemberProfile.state (KYCSubmission.state fallback)',
  },
  address: {
    label: 'Full Address',
    section: 'kyc',
    exportable: true,
    persisted: true,
    prismaSource: 'MemberProfile.address (KYCSubmission.address fallback)',
  },
  bankName: {
    label: 'Select Bank',
    section: 'kyc',
    exportable: true,
    persisted: true,
    prismaSource: 'User.bankName',
    placeholder: 'Select Bank',
  },
  accountNumber: {
    label: 'Account Number',
    section: 'kyc',
    exportable: true,
    persisted: true,
    prismaSource: 'User.accountNumber',
  },
  accountName: {
    label: 'Account Name',
    section: 'kyc',
    exportable: true,
    persisted: true,
    prismaSource: 'User.accountName',
  },
  sponsorCode: {
    label: 'Sponsor / Referral Code',
    section: 'codes',
    exportable: true,
    persisted: true,
    prismaSource: 'User.sponsorId -> sponsor.referralCode',
    placeholder: 'Sponsor code',
  },
  activationCode: {
    label: 'Activation Code (Separate)',
    section: 'codes',
    exportable: true,
    persisted: true,
    prismaSource: 'ActivationCode.code where redeemedBy = User.id',
    placeholder: 'e.g. GMA-123456',
  },
  agreeTerms: {
    label: 'Terms agreement',
    section: 'codes',
    exportable: false,
    persisted: false,
  },
} as const satisfies Record<string, AccountRegistrationFieldDefinition>;

export type AccountRegistrationFieldName = keyof typeof ACCOUNT_REGISTRATION_FIELDS;

export const OFFICIAL_MEMBER_REGISTER_FIELD_NAMES = [
  'firstName',
  'lastName',
  'username',
  'phone',
  'email',
  'gender',
  'state',
  'address',
  'bankName',
  'accountNumber',
  'accountName',
  'sponsorCode',
  'activationCode',
] as const satisfies readonly AccountRegistrationFieldName[];

export const OFFICIAL_MEMBER_REGISTER_FIELD_DEFINITIONS = OFFICIAL_MEMBER_REGISTER_FIELD_NAMES.map(
  (name) => ({
    name,
    ...ACCOUNT_REGISTRATION_FIELDS[name],
  })
);

export function assertOfficialMemberRegisterFieldAlignment() {
  const expectedFieldNames = Object.entries(ACCOUNT_REGISTRATION_FIELDS)
    .filter(([, field]) => field.exportable)
    .map(([name]) => name as AccountRegistrationFieldName);
  const actualFieldNames: AccountRegistrationFieldName[] = [
    ...OFFICIAL_MEMBER_REGISTER_FIELD_NAMES,
  ];
  const duplicateFieldNames = findDuplicates(actualFieldNames);
  const missingFieldNames = expectedFieldNames.filter((name) => !actualFieldNames.includes(name));
  const extraFieldNames = actualFieldNames.filter((name) => !expectedFieldNames.includes(name));
  const unsafeFieldNames = actualFieldNames.filter((name) => {
    const field = ACCOUNT_REGISTRATION_FIELDS[name];
    return !field.exportable || ('sensitive' in field && field.sensitive);
  });

  if (
    duplicateFieldNames.length > 0 ||
    missingFieldNames.length > 0 ||
    extraFieldNames.length > 0 ||
    unsafeFieldNames.length > 0
  ) {
    throw new Error(
      [
        duplicateFieldNames.length ? `duplicate fields: ${duplicateFieldNames.join(', ')}` : null,
        missingFieldNames.length ? `missing fields: ${missingFieldNames.join(', ')}` : null,
        extraFieldNames.length ? `extra fields: ${extraFieldNames.join(', ')}` : null,
        unsafeFieldNames.length ? `unsafe fields: ${unsafeFieldNames.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('; ')
    );
  }
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates];
}
