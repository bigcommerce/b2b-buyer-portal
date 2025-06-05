import B3Request from '@/shared/service/request/b3Fetch';

const getUserExtraFields = `
  query GetUserExtraFields {
    userExtraFields {
      fieldName
      fieldType
      isRequired
      defaultValue
      maximumLength
      numberOfRows
      maximumValue
      listOfValue
      visibleToEnduser
      labelName
    }
  }
`;

export interface UserExtraFieldsInfoResponse {
  data: {
    userExtraFields: Array<{
      fieldName: string;
      fieldType: 0 | 1 | 2 | 3;
      isRequired: boolean;
      defaultValue: string | null;
      maximumLength: string | null;
      numberOfRows: number | null;
      maximumValue: string | null;
      listOfValue: string[] | null;
      visibleToEnduser: boolean;
      labelName: string;
    }>;
  };
}

export const getUsersExtraFieldsInfo = () =>
  B3Request.graphqlB2B<UserExtraFieldsInfoResponse>({ query: getUserExtraFields });
