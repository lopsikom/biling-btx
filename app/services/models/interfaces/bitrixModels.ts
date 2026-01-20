export interface IField {
    type : string,
    isRequired : number,
    isReadOnly : number,
    isImmutable : number,
    isMultiple : number,
    isDynamic : number,
    title : string
}

export interface IUserField{
    ID : number,
    ENTITY_ID : string,
    FIELD_NAME : string,
    USER_TYPE_ID : string,
    XML_ID : string,
    SORT : number,
    MULTIPLE : 'N' | 'Y',
    MANDATORY : 'N' | 'Y',
    SHOW_FILTER : 'N' | 'Y',
    SHOW_IN_LIST : 'N' | 'Y',
    EDIT_IN_LIST : 'N' | 'Y',
    IS_SEARCHABLE : 'N' | 'Y',
    SETTINGS : {
        SIZE : number,
        ROWS : number,
        REGEXP : string,
        MIN_LENGTH : number,
        MAX_LENGTH : number,
        DEFAULT_VALUE : string
    }
}

export interface ICompnany {
  ID: number;
  COMPANY_TYPE: string;
  TITLE: string;

  LOGO: string | null;
  LEAD_ID: number | null;

  HAS_PHONE: 'Y' | 'N';
  HAS_EMAIL: 'Y' | 'N';
  HAS_IMOL: 'Y' | 'N';

  ASSIGNED_BY_ID: number;
  CREATED_BY_ID: number;
  MODIFY_BY_ID: number;

  BANKING_DETAILS: string | null;
  INDUSTRY: string | null;

  REVENUE: number | null;
  CURRENCY_ID: string | null;
  EMPLOYEES: string | null;

  COMMENTS: string | null;

  DATE_CREATE: string;
  DATE_MODIFY: string; 

  OPENED: 'Y' | 'N';
  IS_MY_COMPANY: 'Y' | 'N';

  ORIGINATOR_ID: string | null;
  ORIGIN_ID: string | null;
  ORIGIN_VERSION: string | null;

  ADDRESS: string | null;
  ADDRESS_2: string | null;
  ADDRESS_CITY: string | null;
  ADDRESS_POSTAL_CODE: string | null;
  ADDRESS_REGION: string | null;
  ADDRESS_PROVINCE: string | null;
  ADDRESS_COUNTRY: string | null;
  ADDRESS_COUNTRY_CODE: string | null;
  ADDRESS_LOC_ADDR_ID: string | null;

  ADDRESS_LEGAL: string | null;

  REG_ADDRESS: string | null;
  REG_ADDRESS_2: string | null;
  REG_ADDRESS_CITY: string | null;
  REG_ADDRESS_POSTAL_CODE: string | null;
  REG_ADDRESS_REGION: string | null;
  REG_ADDRESS_PROVINCE: string | null;
  REG_ADDRESS_COUNTRY: string | null;
  REG_ADDRESS_COUNTRY_CODE: string | null;
  REG_ADDRESS_LOC_ADDR_ID: string | null;

  UTM_SOURCE: string | null;
  UTM_MEDIUM: string | null;
  UTM_CAMPAIGN: string | null;
  UTM_CONTENT: string | null;
  UTM_TERM: string | null;

  LAST_ACTIVITY_BY: number | null;
  LAST_ACTIVITY_TIME: string | null;
  LAST_COMMUNICATION_TIME: string | null;

  USER_FIELDS? : IField[]
}
export interface IRequisite{
    ENTITY_TYPE_ID : number,
    ENTITY_ID : number,
    PRESET_ID : number,
    NAME : string,
    CODE? : string,
    RQ_INN? : string,
    RQ_KPP? : string,
    RQ_IFNS? : string,
    RQ_OGRN? : string,
    RQ_OGRNIP? : string,
    RQ_OKPO? : string,
}

export interface IContact{
    ID : number,
    POST? : string,
    NAME? : string,
    SECOND_NAME? : string,
    LAST_NAME? : string,
    LEAD_ID? : number,
    TYPE_ID? : string,
    SOURSCE_ID? : string,
    COMPANY_ID? : number,
    DATE_CREATE? : string
    ASSIGNED_BY_ID? : number,
    CREATED_BY_ID? : number,
    PHONE? : string,
    EMAIL : string
}
export interface IUser{
    ID : number,
    NAME : string,
    LAST_NAME : string,
    SECOND_NAME : string,
    EMAIL : string,
    LAST_LOGIN : string,
    IS_ONLINE : "Y" | "N",
    WORK_PHONE : string,
    WORK_POSITION : string,
    ACTIVE : boolean
}