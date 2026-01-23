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

  LOGO: string | undefined;
  LEAD_ID: number | undefined;

  HAS_PHONE: 'Y' | 'N';
  HAS_EMAIL: 'Y' | 'N';
  HAS_IMOL: 'Y' | 'N';

  ASSIGNED_BY_ID: number;
  CREATED_BY_ID: number;
  MODIFY_BY_ID: number;

  BANKING_DETAILS: string | undefined;
  INDUSTRY: string | undefined;

  REVENUE: number | undefined;
  CURRENCY_ID: string | undefined;
  EMPLOYEES: string | undefined;

  COMMENTS: string | undefined;

  DATE_CREATE: string;
  DATE_MODIFY: string; 

  OPENED: 'Y' | 'N';
  IS_MY_COMPANY: 'Y' | 'N';

  ORIGINATOR_ID: string | undefined;
  ORIGIN_ID: string | undefined;
  ORIGIN_VERSION: string | undefined;

  ADDRESS: string | undefined;
  ADDRESS_2: string | undefined;
  ADDRESS_CITY: string | undefined;
  ADDRESS_POSTAL_CODE: string | undefined;
  ADDRESS_REGION: string | undefined;
  ADDRESS_PROVINCE: string | undefined;
  ADDRESS_COUNTRY: string | undefined;
  ADDRESS_COUNTRY_CODE: string | undefined;
  ADDRESS_LOC_ADDR_ID: string | undefined;

  ADDRESS_LEGAL: string | undefined;

  REG_ADDRESS: string | undefined;
  REG_ADDRESS_2: string | undefined;
  REG_ADDRESS_CITY: string | undefined;
  REG_ADDRESS_POSTAL_CODE: string | undefined;
  REG_ADDRESS_REGION: string | undefined;
  REG_ADDRESS_PROVINCE: string | undefined;
  REG_ADDRESS_COUNTRY: string | undefined;
  REG_ADDRESS_COUNTRY_CODE: string | undefined;
  REG_ADDRESS_LOC_ADDR_ID: string | undefined;

  UTM_SOURCE: string | undefined;
  UTM_MEDIUM: string | undefined;
  UTM_CAMPAIGN: string | undefined;
  UTM_CONTENT: string | undefined;
  UTM_TERM: string | undefined;

  LAST_ACTIVITY_BY: number;
  LAST_ACTIVITY_TIME: string;
  LAST_COMMUNICATION_TIME: string | undefined;

  USER_FIELDS? : IField[]
}
export interface IRequisite{
    ID : number,
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
    PHONE? : Array<{
        ID : number,
        VALUE_TYPE : string,
        VALUE : string,
        TYPE_ID : string
    }>,
    EMAIL? : Array<{
        ID : number,
        VALUE_TYPE : string,
        VALUE : string,
        TYPE_ID : string
    }>
}
export interface IUser{
    ID : number,
    NAME? : string,
    LAST_NAME? : string,
    SECOND_NAME? : string,
    EMAIL? : string,
    LAST_LOGIN? : string,
    IS_ONLINE? : "Y" | "N",
    WORK_PHONE? : string,
    WORK_POSITION? : string,
    ACTIVE? : boolean
}
export interface IAddress{
    TYPE_ID : number,
    ENTITY_TYPE_ID : number,
    ENTITY_ID : number,
    ADDRESS_1? : string,
    ADDRESS_2? : string,
    CITY? : string,
    POSTAL_CODE? : number
    REGION? : string,
    PROVINCE? : string,
    COUNTRY? : string
}

export interface IAddresType {
    ID : number,
    NAME : string
}