import { entityType } from "./APIModels";

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
  ID: string;
  COMPANY_TYPE: string;
  TITLE: string;

  LOGO: string | undefined;
  LEAD_ID: number | undefined;

  HAS_PHONE: 'Y' | 'N';
  HAS_EMAIL: 'Y' | 'N';
  HAS_IMOL: 'Y' | 'N';

  ASSIGNED_BY_ID: string;
  CREATED_BY_ID: string;
  MODIFY_BY_ID: string;

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

  LAST_ACTIVITY_BY: string;
  LAST_ACTIVITY_TIME: string;
  LAST_COMMUNICATION_TIME: string | undefined;

  USER_FIELDS? : IField[]
}

export interface BitrixCompanyFm {
  id: number;
  valueType: string;
  value: string;
  typeId: string;
}

export interface NewBitrixCompany {
  id: number;
  createdTime: string;
  updatedTime: string;
  createdBy: number;
  updatedBy: number;
  assignedById: number;
  opened: string;
  title: string;
  logo: string;
  address: string;
  addressLegal: string;
  bankingDetails: string;
  comments: string;
  typeId: string;
  industry: string;
  revenue: number;
  currencyId: string;
  employees: string;
  leadId: number;
  webformId: number;
  originatorId: string | null;
  originId: string | null;
  originVersion: string | null;
  hasPhone: string;
  hasEmail: string;
  hasImol: string;
  isMyCompany: string;
  searchContent: string;
  categoryId: number;
  lastActivityBy: number;
  lastActivityTime: string;
  emailHome: string;
  emailWork: string;
  emailMailing: string;
  phoneMobile: string;
  phoneWork: string;
  phoneMailing: string;
  imol: string;
  email: string;
  phone: string;
  lastCommunicationTime: string | null;
  lastCommunicationCallTime: string | null;
  lastCommunicationEmailTime: string | null;
  lastCommunicationImolTime: string | null;
  lastCommunicationWebformTime: string | null;
  ufLogo: string | null;
  ufStamp: string | null;
  ufDirectorSign: string | null;
  ufAccountantSign: string | null;
  parentId1058: number | null;
  parentId1066: number | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  observers: number[];
  contactIds: number[];
  entityTypeId: number;
  fm: BitrixCompanyFm[];
  [key: `ufCrm${string}`]: string | null;
}

export interface IRequisite{
    ID : string,
    ENTITY_TYPE_ID : number,
    ENTITY_ID : number,
    PRESET_ID : number,
    NAME : string,
    CODE? : string,
    SORT : number,
    ACTIVE : "Y" | "N",
    RQ_INN? : string,
    RQ_KPP? : string,
    RQ_IFNS? : string,
    RQ_OGRN? : string,
    RQ_OGRNIP? : string,
    RQ_OKPO? : string,
}

export interface IContact{
    ID : string,
    POST? : string,
    NAME : string,
    SECOND_NAME? : string,
    OPENED? : "Y" | "N",
    LAST_NAME? : string,
    LEAD_ID? : number,
    TYPE_ID? : string,
    SOURSCE_ID? : string,
    COMPANY_ID? : number,
    DATE_CREATE : string
    ASSIGNED_BY_ID? : string,
    CREATED_BY_ID? : string,
    MODIFY_BY_ID? : string,
    DATE_MODIFY : string,
    PHONE? : Array<IContactInfo>,
    EMAIL? : Array<IContactInfo>
}
export interface IContactInfo{
    ID? : string,
    VALUE_TYPE? : string,
    VALUE ?: string,
    TYPE_ID? : string
}
export interface IUser{
    ID : string,
    NAME? : string,
    LAST_NAME? : string,
    SECOND_NAME? : string,
    EMAIL? : string,
    LAST_LOGIN? : string,
    IS_ONLINE? : "Y" | "N",
    WORK_PHONE? : string,
    PERSONAL_PHONE? : string
    WORK_POSITION? : string,
    ACTIVE? : number,
    PERSONAL_PHOTO? : string
}
export interface IAddress{
    TYPE_ID : number,
    ENTITY_TYPE_ID : string,
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
    ID : string,
    NAME : string
}
export interface IEditContacts extends IContact {
    TITLE_NAME? : string
}
export interface Invoice {
  id: number;
  title: string;
  xmlId: string | null;

  createdTime: string | null;
  updatedTime: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  assignedById: string | null;

  opened: string;
  webformId: number | null;

  lastCommunicationTime: string | null;
  begindate: string | null;
  closedate: string | null;
  companyId: number | null;

  contactId: number | null;
  contactIds: number[] | null;
  contacts: number[] | null;
  observers: number[] | null;

  categoryId: number | null;
  movedTime: string | null;
  movedBy: number | null;

  stageId: string | null;
  previousStageId: string | null;

  sourceId: string | null;
  sourceDescription: string | null;

  currencyId: string | null;
  isManualOpportunity: boolean;
  opportunity: number | null;
  taxValue: number | null;

  mycompanyId: number | null;
  lastActivityBy: string | null;
  lastActivityTime: string | null;

  isRecurring: boolean;
  comments: string | null;

  accountNumber: string | null;
  locationId: number | null;

  parentId2: number | null;
  parentId7: number | null;

  lastCommunicationCallTime: string | null;
  lastCommunicationEmailTime: string | null;
  lastCommunicationImolTime: string | null;
  lastCommunicationWebformTime: string | null;
}

export interface IAppInfo {
    client_id : string,
    scope : string,
    expires: string,
    install : {
        installed : boolean,
        version : string,
        status : string,
        scope : string,
        domain : string,
        uri: string,
        client_endpoint : string,
        member_id : string,
        member_type : string
    },
    user_id : number
} 
export interface IBitrixToken{
    access_token : string,
    client_endpoint : string,
    domain : string,
    expires_in : number,
    member_id : string,
    refresh_token : string,
    scope : string,
    server_endpoint : string,
    status : string
}

export type InvoiceGrid = {
    id : string
    name : string,
    assign : string,
    oppuration : number,
    currencyId : string,
    status? : string,
    beginDate? : string,
    closeDate? : string
}

export interface IStage {
    ID : number,
    TYPE_ID : number,
    OWNER_ID : number,
    CREATED_TIME : string,
    CATEGORY_ID : number,
    STAGE_SEMANTIC_ID : string,
    STAGE_ID : DealStageStatus
}

export interface IResponseArrayNewBitrix<T>{
    result : {
        items : T[]
    },
    total : number,
    time : any

}
export interface IResponseNewBitrix<T>{
    result : {
        item : T
    },
    total : number,
    time : any

}
export interface IDeal{
  ID: string;
  TITLE: string;
  TYPE_ID: string;
  STAGE_ID: string;
  PROBABILITY: string;
  CURRENCY_ID: string;
  OPPORTUNITY: string;
  IS_MANUAL_OPPORTUNITY: "Y" | "N";
  TAX_VALUE: string;
  LEAD_ID: string | null;
  COMPANY_ID: string;
  CONTACT_ID: string;
  QUOTE_ID: string | null;
  BEGINDATE: string;
  CLOSEDATE: string;
  ASSIGNED_BY_ID: string;
  CREATED_BY_ID: string;
  MODIFY_BY_ID: string;
  DATE_CREATE: string;
  DATE_MODIFY: string;
  OPENED: "Y" | "N";
  CLOSED: "Y" | "N";
  COMMENTS: string;
  ADDITIONAL_INFO: string;
  LOCATION_ID: string | null;
  CATEGORY_ID: string;
  STAGE_SEMANTIC_ID: "P";
  IS_NEW: "Y" | "N";
  IS_RECURRING: "Y" | "N";
  IS_RETURN_CUSTOMER: "Y" | "N";
  IS_REPEATED_APPROACH: "Y" | "N";
  SOURCE_ID: string;
  SOURCE_DESCRIPTION: string;
  ORIGINATOR_ID: string | null;
  ORIGIN_ID: string | null;
  MOVED_BY_ID: string;
  MOVED_TIME: string;
  LAST_ACTIVITY_TIME: string;
  UTM_SOURCE: string;
  UTM_MEDIUM: string;
  UTM_CAMPAIGN: string | null;
  UTM_CONTENT: string | null;
  UTM_TERM: string | null;
  PARENT_ID_1220: string;
  LAST_ACTIVITY_BY: string;
  UF_CRM_1721244482250: string;
}

export enum DealStageStatus {
    // === Воронка 0 (DEAL_STAGE — общая) ===
    STAGE_NEW = "NEW",
    STAGE_NDS = "UC_60MINX",          // НДЗ
    STAGE_VKS = "UC_I9CU0Z",          // ВКС
    STAGE_NAZVANIE = "UC_8V6KDC",     // Название
    STAGE_WON = "WON",                // Сделка успешна
    STAGE_LOSE = "LOSE",              // Сделка провалена

    // === Воронка 9 (DEAL_STAGE_9) ===
    C9_NEW = "C9:NEW",                       // Новая сделка
    C9_RAZBOR = "C9:6",                      // Разобрать (Газ с фото)
    C9_OTLOJILI = "C9:11",                   // Отложили
    C9_HOTYAT_NE_MOGUT = "C9:UC_7AK1KN",    // Хотят но пока не могут
    C9_PREZENTACIYA = "C9:1",               // Назначена презентация
    C9_KP_OTPRAVLENO = "C9:2",              // Отправлено КП
    C9_NA_RESHENII = "C9:3",               // На решении
    C9_PREPARATION = "C9:PREPARATION",      // Отправлен договор
    C9_DOGOVOR_PODPISAN = "C9:PREPAYMENT_INVOICE", // Договор подписан
    C9_VNEDRENIE = "C9:FINAL_INVOICE",      // Внедрение
    C9_RABOTA_VYPOLNENA = "C9:10",          // Работа выполнена
    C9_PODPISANIE_AKTA = "C9:UC_ZI0S81",   // Подписание Акта ПО
    C9_PREZENTACIYA_PROVEDENA = "C9:7",    // Презентация проведена
    C9_WON = "C9:WON",                     // Сделка успешна
    C9_LOSE = "C9:LOSE",                   // Сделка провалена

    // === Воронка 10 (DEAL_STAGE_10) ===
    C10_RABOTAYUT = "C10:NEW",                    // Работают
    C10_OTKAZALIS = "C10:UC_U0BNPJ",             // Отказались работать
    C10_USLOVNYY_OTKAZ = "C10:PREPARATION",      // Условный отказ
    C10_OTLOJILI = "C10:UC_CVNGGA",              // Отложили
    C10_RABOTAYUT_KZ = "C10:UC_DPBIN7",          // Работают Казахстан
    C10_WON = "C10:WON",                         // Сделка успешна
    C10_LOSE = "C10:LOSE",                        // Сделка провалена

    // === Воронка 12 (DEAL_STAGE_12) ===
    C12_NEW = "C12:NEW",                          // Новая сделка
    C12_OTLOJILI = "C12:PREPAYMENT_INVOIC",       // Отложили
    C12_PREZENTACIYA = "C12:EXECUTING",           // Назначена презентация
    C12_PREZENTACIYA_PROVEDENA = "C12:UC_2Z7KEI", // Презентация проведена
    C12_KP_OTPRAVLENO = "C12:FINAL_INVOICE",      // Отправлено КП
    C12_NA_PAUZE = "C12:UC_XC8R7Y",              // Встали на паузу
    C12_NA_RESHENII = "C12:UC_8Q70MV",           // На решении
    C12_DOGOVOR_OTPRAVLEN = "C12:UC_PYCJYT",     // Отправлен договор
    C12_DOGOVOR_PODPISAN = "C12:UC_Z05R0D",      // Договор подписан
    C12_VNEDRENIE = "C12:UC_2FDYLM",             // Внедрение
    C12_RABOTA_VYPOLNENA = "C12:UC_TJQ81I",      // Работа выполнена
    C12_SCHET_OPLACHEN = "C12:UC_XFGT2R",        // Счёт оплачен
    C12_WON = "C12:WON",                         // Сделка успешна
    C12_LOSE = "C12:LOSE",                        // Сделка провалена
    C12_APOLOGY = "C12:APOLOGY",                  // Анализ причины провала

    // === Воронка 15 (DEAL_STAGE_15) ===
    C15_NEW = "C15:NEW",                          // Первое касание
    C15_NDZ = "C15:PREPARATION",                  // НДЗ
    C15_VKS = "C15:PREPAYMENT_INVOIC",            // ВКС
    C15_KP = "C15:EXECUTING",                     // КП
    C15_DOGOVOR = "C15:FINAL_INVOICE",            // Договор
    C15_VNEDRENIE = "C15:UC_BPG9T4",             // Внедрение
    C15_AKTY_PO = "C15:UC_P8V01H",              // Акты ПО
    C15_WON = "C15:WON",                          // Сделка успешна
    C15_LOSE = "C15:LOSE",                         // Сделка провалена
    C15_APOLOGY = "C15:APOLOGY",                   // Анализ причины провала

    // === Воронка 16 (DEAL_STAGE_16) ===
    C16_NEW = "C16:NEW",                          // Не обработано
    C16_NDZ = "C16:PREPARATION",                  // НДЗ
    C16_OTLOJILI = "C16:PREPAYMENT_INVOIC",       // Отложили
    C16_PRESALE = "C16:EXECUTING",                // Пресейл
    C16_VKS = "C16:FINAL_INVOICE",               // ВКС
    C16_KP = "C16:UC_FEQIOQ",                    // КП
    C16_DOGOVOR = "C16:UC_WTAQ5Y",               // Договор
    C16_WON = "C16:WON",                          // Сделка успешна
    C16_LOSE = "C16:LOSE",                         // Сделка провалена
    C16_APOLOGY = "C16:APOLOGY",                   // Анализ причины провала

    // === Воронка 17 (DEAL_STAGE_17) ===
    C17_NEW = "C17:NEW",                          // Новая
    C17_VKS = "C17:PREPARATION",                  // ВКС
    C17_KP = "C17:PREPAYMENT_INVOIC",             // КП
    C17_DOGOVOR = "C17:UC_QJCFAU",               // Договор
    C17_VNEDRENIE = "C17:UC_W1KDYO",             // Внедрение
    C17_AKTY_PO = "C17:EXECUTING",               // Акты ПО
    C17_WON = "C17:WON",                          // Сделка успешна
    C17_LOSE = "C17:LOSE",                         // Сделка провалена
    C17_APOLOGY = "C17:APOLOGY",                   // Анализ причины провала

    // === Воронка 18 (DEAL_STAGE_18) ===
    C18_NEW = "C18:NEW",                          // Новая
    C18_PODGOTOVKA_KP = "C18:PREPARATION",        // Подготовка КП
    C18_KP_OTPRAVLENO = "C18:PREPAYMENT_INVOIC",  // КП отправлено
    C18_FORMIROVANIE_DOGOVORA = "C18:EXECUTING",  // Формирование договора
    C18_DOGOVOR_PODPISAN = "C18:FINAL_INVOICE",   // Договор подписан
    C18_WON = "C18:WON",                          // Сделка успешна
    C18_LOSE = "C18:LOSE",                         // Сделка провалена
    C18_APOLOGY = "C18:APOLOGY",                   // Анализ причины провала

    // === Воронка 19 (DEAL_STAGE_19) ===
    C19_NEW = "C19:NEW",                          // Новая
    C19_PODGOTOVKA_DOCS = "C19:PREPARATION",      // Подготовка документов
    C19_SCHET_PREDOPLATA = "C19:PREPAYMENT_INVOIC", // Счёт на предоплату
    C19_V_RABOTE = "C19:EXECUTING",               // В работе
    C19_FINALNYY_SCHET = "C19:FINAL_INVOICE",     // Финальный счёт
    C19_WON = "C19:WON",                          // Сделка успешна
    C19_LOSE = "C19:LOSE",                         // Сделка провалена
    C19_APOLOGY = "C19:APOLOGY",                   // Анализ причины провала
}
export enum Bitrix24Event {
    // // App
    // APP_UNINSTALL = "ONAPPUNINSTALL",
    // APP_INSTALL = "ONAPPINSTALL",
    // APP_UPDATE = "ONAPPUPDATE",
    // APP_PAYMENT = "ONAPPPAYMENT",
    // APP_TEST = "ONAPPTEST",
    // APP_METHOD_CONFIRM = "ONAPPMETHODCONFIRM",
    // OFFLINE_EVENT = "ONOFFLINEEVENT",

    // // User
    // USER_ADD = "ONUSERADD",

    // // Invoice
    // CRM_INVOICE_ADD = "ONCRMINVOICEADD",
    // CRM_INVOICE_UPDATE = "ONCRMINVOICEUPDATE",
    // CRM_INVOICE_DELETE = "ONCRMINVOICEDELETE",
    // CRM_INVOICE_SET_STATUS = "ONCRMINVOICESETSTATUS",
    // CRM_INVOICE_USERFIELD_ADD = "ONCRMINVOICEUSERFIELDADD",
    // CRM_INVOICE_USERFIELD_UPDATE = "ONCRMINVOICEUSERFIELDUPDATE",
    // CRM_INVOICE_USERFIELD_DELETE = "ONCRMINVOICEUSERFIELDDELETE",
    // CRM_INVOICE_USERFIELD_SET_ENUM_VALUES = "ONCRMINVOICEUSERFIELDSETENUMVALUES",

    // // Invoice Recurring
    // CRM_INVOICE_RECURRING_ADD = "ONCRMINVOICERECURRINGADD",
    // CRM_INVOICE_RECURRING_UPDATE = "ONCRMINVOICERECURRINGUPDATE",
    // CRM_INVOICE_RECURRING_DELETE = "ONCRMINVOICERECURRINGDELETE",
    // CRM_INVOICE_RECURRING_EXPOSE = "ONCRMINVOICERECURRINGEXPOSE",

    // // Lead
    // CRM_LEAD_ADD = "ONCRMLEADADD",
    // CRM_LEAD_UPDATE = "ONCRMLEADUPDATE",
    // CRM_LEAD_DELETE = "ONCRMLEADDELETE",
    // CRM_LEAD_USERFIELD_ADD = "ONCRMLEADUSERFIELDADD",
    // CRM_LEAD_USERFIELD_UPDATE = "ONCRMLEADUSERFIELDUPDATE",
    // CRM_LEAD_USERFIELD_DELETE = "ONCRMLEADUSERFIELDDELETE",
    // CRM_LEAD_USERFIELD_SET_ENUM_VALUES = "ONCRMLEADUSERFIELDSETENUMVALUES",

    // // Deal
    // CRM_DEAL_ADD = "ONCRMDEALADD",
    // CRM_DEAL_UPDATE = "ONCRMDEALUPDATE",
    // CRM_DEAL_DELETE = "ONCRMDEALDELETE",
    // CRM_DEAL_MOVE_TO_CATEGORY = "ONCRMDEALMOVETOCATEGORY",
    // CRM_DEAL_USERFIELD_ADD = "ONCRMDEALUSERFIELDADD",
    // CRM_DEAL_USERFIELD_UPDATE = "ONCRMDEALUSERFIELDUPDATE",
    // CRM_DEAL_USERFIELD_DELETE = "ONCRMDEALUSERFIELDDELETE",
    // CRM_DEAL_USERFIELD_SET_ENUM_VALUES = "ONCRMDEALUSERFIELDSETENUMVALUES",

    // // Deal Recurring
    // CRM_DEAL_RECURRING_ADD = "ONCRMDEALRECURRINGADD",
    // CRM_DEAL_RECURRING_UPDATE = "ONCRMDEALRECURRINGUPDATE",
    // CRM_DEAL_RECURRING_DELETE = "ONCRMDEALRECURRINGDELETE",
    // CRM_DEAL_RECURRING_EXPOSE = "ONCRMDEALRECURRINGEXPOSE",

    // // Company
    CRM_COMPANY_ADD = "ONCRMCOMPANYADD",
    // CRM_COMPANY_UPDATE = "ONCRMCOMPANYUPDATE",
    CRM_COMPANY_DELETE = "ONCRMCOMPANYDELETE",
    // CRM_COMPANY_USERFIELD_ADD = "ONCRMCOMPANYUSERFIELDADD",
    // CRM_COMPANY_USERFIELD_UPDATE = "ONCRMCOMPANYUSERFIELDUPDATE",
    // CRM_COMPANY_USERFIELD_DELETE = "ONCRMCOMPANYUSERFIELDDELETE",
    // CRM_COMPANY_USERFIELD_SET_ENUM_VALUES = "ONCRMCOMPANYUSERFIELDSETENUMVALUES",

    // // Contact
    // CRM_CONTACT_ADD = "ONCRMCONTACTADD",
    // CRM_CONTACT_UPDATE = "ONCRMCONTACTUPDATE",
    // CRM_CONTACT_DELETE = "ONCRMCONTACTDELETE",
    // CRM_CONTACT_USERFIELD_ADD = "ONCRMCONTACTUSERFIELDADD",
    // CRM_CONTACT_USERFIELD_UPDATE = "ONCRMCONTACTUSERFIELDUPDATE",
    // CRM_CONTACT_USERFIELD_DELETE = "ONCRMCONTACTUSERFIELDDELETE",
    // CRM_CONTACT_USERFIELD_SET_ENUM_VALUES = "ONCRMCONTACTUSERFIELDSETENUMVALUES",

    // // Quote
    // CRM_QUOTE_ADD = "ONCRMQUOTEADD",
    // CRM_QUOTE_UPDATE = "ONCRMQUOTEUPDATE",
    // CRM_QUOTE_DELETE = "ONCRMQUOTEDELETE",
    // CRM_QUOTE_USERFIELD_ADD = "ONCRMQUOTEUSERFIELDADD",
    // CRM_QUOTE_USERFIELD_UPDATE = "ONCRMQUOTEUSERFIELDUPDATE",
    // CRM_QUOTE_USERFIELD_DELETE = "ONCRMQUOTEUSERFIELDDELETE",
    // CRM_QUOTE_USERFIELD_SET_ENUM_VALUES = "ONCRMQUOTEUSERFIELDSETENUMVALUES",

    // // Currency
    // CRM_CURRENCY_ADD = "ONCRMCURRENCYADD",
    // CRM_CURRENCY_UPDATE = "ONCRMCURRENCYUPDATE",
    // CRM_CURRENCY_DELETE = "ONCRMCURRENCYDELETE",

    // // Product
    CRM_PRODUCT_ADD = "ONCRMPRODUCTADD",
    CRM_PRODUCT_UPDATE = "ONCRMPRODUCTUPDATE",
    CRM_PRODUCT_DELETE = "ONCRMPRODUCTDELETE",
    CRM_PRODUCT_PROPERTY_ADD = "ONCRMPRODUCTPROPERTYADD",
    CRM_PRODUCT_PROPERTY_UPDATE = "ONCRMPRODUCTPROPERTYUPDATE",
    CRM_PRODUCT_PROPERTY_DELETE = "ONCRMPRODUCTPROPERTYDELETE",
    CRM_PRODUCT_SECTION_ADD = "ONCRMPRODUCTSECTIONADD",
    CRM_PRODUCT_SECTION_UPDATE = "ONCRMPRODUCTSECTIONUPDATE",
    CRM_PRODUCT_SECTION_DELETE = "ONCRMPRODUCTSECTIONDELETE",

    // // Activity
    // CRM_ACTIVITY_ADD = "ONCRMACTIVITYADD",
    // CRM_ACTIVITY_UPDATE = "ONCRMACTIVITYUPDATE",
    // CRM_ACTIVITY_DELETE = "ONCRMACTIVITYDELETE",

    // // Requisite
    // CRM_REQUISITE_ADD = "ONCRMREQUISITEADD",
    // CRM_REQUISITE_UPDATE = "ONCRMREQUISITEUPDATE",
    // CRM_REQUISITE_DELETE = "ONCRMREQUISITEDELETE",
    // CRM_REQUISITE_USERFIELD_ADD = "ONCRMREQUISITEUSERFIELDADD",
    // CRM_REQUISITE_USERFIELD_UPDATE = "ONCRMREQUISITEUSERFIELDUPDATE",
    // CRM_REQUISITE_USERFIELD_DELETE = "ONCRMREQUISITEUSERFIELDDELETE",
    // CRM_REQUISITE_USERFIELD_SET_ENUM_VALUES = "ONCRMREQUISITEUSERFIELDSETENUMVALUES",

    // // Bank Detail
    // CRM_BANK_DETAIL_ADD = "ONCRMBANKDETAILADD",
    // CRM_BANK_DETAIL_UPDATE = "ONCRMBANKDETAILUPDATE",
    // CRM_BANK_DETAIL_DELETE = "ONCRMBANKDETAILDELETE",

    // // Address
    // CRM_ADDRESS_REGISTER = "ONCRMADDRESSREGISTER",
    // CRM_ADDRESS_UNREGISTER = "ONCRMADDRESSUNREGISTER",

    // // Measure
    // CRM_MEASURE_ADD = "ONCRMMEASUREADD",
    // CRM_MEASURE_UPDATE = "ONCRMMEASUREUPDATE",
    // CRM_MEASURE_DELETE = "ONCRMMEASUREDELETE",

    // // Timeline
    // CRM_TIMELINE_COMMENT_ADD = "ONCRMTIMELINECOMMENTADD",
    // CRM_TIMELINE_COMMENT_UPDATE = "ONCRMTIMELINECOMMENTUPDATE",
    // CRM_TIMELINE_COMMENT_DELETE = "ONCRMTIMELINECOMMENTDELETE",

    // // Dynamic Items
    CRM_DYNAMIC_ITEM_ADD = "ONCRMDYNAMICITEMADD",
    CRM_DYNAMIC_ITEM_UPDATE = "ONCRMDYNAMICITEMUPDATE",
    CRM_DYNAMIC_ITEM_DELETE = "ONCRMDYNAMICITEMDELETE",
    // CRM_DYNAMIC_ITEM_ADD_147 = "ONCRMDYNAMICITEMADD_147",
    // CRM_DYNAMIC_ITEM_UPDATE_147 = "ONCRMDYNAMICITEMUPDATE_147",
    // CRM_DYNAMIC_ITEM_DELETE_147 = "ONCRMDYNAMICITEMDELETE_147",

    // // Type
    // CRM_TYPE_ADD = "ONCRMTYPEADD",
    // CRM_TYPE_UPDATE = "ONCRMTYPEUPDATE",
    // CRM_TYPE_DELETE = "ONCRMTYPEDELETE",

    // // Document Generator
    // CRM_DOCUMENT_GENERATOR_DOCUMENT_ADD = "ONCRMDOCUMENTGENERATORDOCUMENTADD",
    // CRM_DOCUMENT_GENERATOR_DOCUMENT_UPDATE = "ONCRMDOCUMENTGENERATORDOCUMENTUPDATE",
    // CRM_DOCUMENT_GENERATOR_DOCUMENT_DELETE = "ONCRMDOCUMENTGENERATORDOCUMENTDELETE",

    // // Task
    // TASK_ADD = "ONTASKADD",
    // TASK_UPDATE = "ONTASKUPDATE",
    // TASK_DELETE = "ONTASKDELETE",
    // TASK_COMMENT_ADD = "ONTASKCOMMENTADD",
    // TASK_COMMENT_UPDATE = "ONTASKCOMMENTUPDATE",
    // TASK_COMMENT_DELETE = "ONTASKCOMMENTDELETE",
}

export interface IEventBitrix {
    event : Bitrix24Event,
    handler : string,
    auth_type : string,
    offline : number
}

export interface IBitrixWebhookPayload<T> {
  event: string;
  event_handler_id: string;
  data: T;
  ts: string;
  auth: {
    access_token: string;
    expires_in: string;
    scope: string;
    domain: string;
    server_endpoint: string;
    status: string;
    client_endpoint: string;
    member_id: string;
    user_id : string,
    refresh_token: string;
    application_token: string;
  };
}
export interface IDynamicItemEvent {
    FIELDS : {
        ID : string,
        ENTITY_TYPE_ID : string
    }
}
export interface IContractBitrix {
  // --- Read-only system fields ---
  readonly id?: number;
  readonly createdTime?: string;        // datetime ISO
  readonly updatedTime?: string;        // datetime ISO
  readonly createdBy?: number;          // user ID
  readonly updatedBy?: number;          // user ID
  readonly movedTime?: string;          // datetime ISO
  readonly movedBy?: number;            // user ID
  readonly previousStageId?: string;    // crm_status
  readonly lastCommunicationTime?: string;
  readonly lastCommunicationCallTime?: string;
  readonly lastCommunicationEmailTime?: string;
  readonly lastCommunicationImolTime?: string;
  readonly lastCommunicationWebformTime?: string;
 
  // --- Editable base fields ---
  title?: string;
  xmlId?: string;
  opened: "Y" | "N";             // required
  assignedById?: number;       // user ID
  webformId?: number;
  categoryId?: number;         // crm_category (воронка)
  stageId?: string;            // crm_status
  currencyId?: string;         // crm_currency
  opportunity?: number;
  taxValue?: number;
  isManualOpportunity?: "Y" | "N";
  begindate?: string;          // date YYYY-MM-DD
  closedate?: string;          // date YYYY-MM-DD
  companyId?: number;          // crm_company
  mycompanyId?: number;        // crm_company (my company)
 
  /** @deprecated use contactIds instead */
  contactId?: number;
  contactIds?: number[];
  contacts?: number[];
  observers?: number[];        // user IDs
 
  lastActivityBy?: number;     // user ID
  lastActivityTime?: string;   // datetime ISO
 
  // --- Parent relations ---
  parentId2?: number;          // Deal (entityTypeId: 2)
  parentId7?: number;          // Offer (entityTypeId: 7)
 
  // --- Custom (UF) fields ---
  ufCrm7_1772107131118?: string;   // date — Дата начала договора
  ufCrm7_1772107148271?: string;   // date — Дата окончания договора
  ufCrm7_1772523967924?: "Y" | "N";  // "Y" | "N" — Пролонгация
  ufCrm7_1772524025251?: string;   // date — Дата подписания договора
  ufCrm7_1772527646144?: {
    id : number,
    url : string,
    urlMachine : string
  }[]; // file IDs — Файлы договора
  ufCrm7_1773131357728?: "Y" | "N";  // "Y" | "N" — Оригинал получен
  ufCrm7_1773302434?: string[];    // crm links — Доп. соглашения
}
export interface ICompanyNew {
  id: number;
  createdTime: string;
  updatedTime: string;
  createdBy: number;
  updatedBy: number;
  assignedById: number;
  opened: "Y" | "N";
  title: string;
  logo: string;
  address: string | null;
  addressLegal: string | null;
  bankingDetails: string | null;
  comments: string | null;
  typeId: string;
  industry: string;
  revenue: number;
  currencyId: string;
  employees: string;
  leadId: number | null;
  webformId: number;
  originatorId: string | null;
  originId: string | null;
  originVersion: string | null;
  hasPhone: "Y" | "N";
  hasEmail: "Y" | "N";
  hasImol: "Y" | "N";
  isMyCompany: "Y" | "N";
  imol: string;
  email: string;
  phone: string;
  entityTypeId: number;
}

export interface IProductRow {
  id:               number;
  ownerId:          number;
  ownerType:        string;
  productId:        number;
  productName:      ProductEnum;
  price:            number;
  priceAccount:     number;
  priceExclusive:   number;
  priceNetto:       number;
  priceBrutto:      number;
  quantity:         number;
  discountTypeId:   1 | 2;
  discountRate:     number;
  discountSum:      number;
  taxRate:          number | null;
  taxIncluded:      "Y" | "N";
  customized:       "Y" | "N";
  measureCode:      number;
  measureName:      string;
  sort:             number;
  xmlId:            string;
  type:             1 | 2 | 3 | 4 | 5 | 6;
  storeId:          number;
}

export enum ProductEnum {
    AUTOINFO = "Обзвон",
    SMS = "Рассылка в sms",
    VATS = "ВАТС",
    WEB_FORM = "Веб-форма",
    VOICE_ROBOT = "Голосовой робот",
    CHAT_BOT = "Чат-бот"
}

export const ProductToEntityRecord = {
    [ProductEnum.AUTOINFO] : entityType.AUTOINFORMATION,
    [ProductEnum.SMS] : entityType.AUTOINFORMATION,
    [ProductEnum.CHAT_BOT] : entityType.CHAT_BOT,
    [ProductEnum.VATS] : entityType.VATS,
    [ProductEnum.VOICE_ROBOT] : entityType.VOICE_ROBOT,
    [ProductEnum.WEB_FORM] : entityType.WEBFORM
}

export interface ICatalogProduct {
  id:                 number;
  iblockId:           number;       // ID инфоблока каталога (16 = варианты SKU)
  name:               string;       // Название товара
  active:             "Y" | "N";   // Активен ли товар
  available:          "Y" | "N";   // Доступен для покупки
  sort:               number;       // Порядок сортировки
  productName:        string;
  code:               string | null; // Символьный код (slug)
  xmlId:              string | null; // Внешний ID для синхронизации

  type:               1 | 2 | 3 | 4 | 5 | 6;
  // 1 = обычный товар
  // 2 = комплект
  // 3 = товар с вариантами (SKU)
  // 4 = вариант SKU (дочерний элемент)
  // 5 = свободный SKU (без родителя)
  // 6 = невалидный SKU

  parentId:           { value: string; valueId: string } | null;
  // Родительский товар (для type=4, т.е. SKU → родитель type=3)

  bundle:             "Y" | "N";   // Является ли комплектом
  barcodeMulti:       "Y" | "N";   // Несколько штрихкодов
  canBuyZero:         "Y" | "N";   // Можно купить при нулевом остатке
  subscribe:          "Y" | "N";   // Подписка
  withoutOrder:       "Y" | "N";   // Без оформления заказа

  quantity:           number | null;          // Остаток на складе
  quantityReserved:   number | null;          // Зарезервировано
  quantityTrace:      "Y" | "N" | "D";       // Учёт остатков (D = по умолчанию)

  purchasingPrice:    number | null;          // Закупочная цена
  purchasingCurrency: string | null;          // Валюта закупочной цены

  vatId:              number | null;          // ID ставки НДС
  vatIncluded:        "Y" | "N";             // НДС включён в цену

  measure:            number | null;          // Код единицы измерения (ОКЕИ)
  weight:             number | null;          // Вес (г)
  width:              number | null;          // Ширина (мм)
  height:             number | null;          // Высота (мм)
  length:             number | null;          // Длина (мм)

  previewText:        string | null;          // Краткое описание
  previewTextType:    "text" | "html";
  detailText:         string | null;          // Подробное описание
  detailTextType:     "text" | "html";
  previewPicture:     number | null;          // ID файла превью
  detailPicture:      number | null;          // ID файла детального фото

  iblockSectionId:    number | null;          // ID основного раздела каталога
  iblockSection:      number[] | null;        // Все разделы (множественная привязка)

  recurSchemeType:    "D" | "W" | "M" | "Q" | "Y"; // Период подписки
  recurSchemeLength:  number | null;          // Длина периода подписки
  trialPriceId:       number | null;          // ID пробной цены

  createdBy:          number;                 // ID пользователя, создавшего товар
  modifiedBy:         number;                 // ID пользователя, изменившего товар
  dateCreate:         string;                 // Дата создания (ISO 8601)
  timestampX:         string;                 // Дата последнего изменения (ISO 8601)
  dateActiveFrom:     string | null;          // Начало активности
  dateActiveTo:       string | null;          // Конец активности
}


export interface IChatBotProduct extends ICatalogProduct {

  // ── Каналы коммуникации ────────────────────────────────────────────────────
  productName : "Чат-бот",
  property317: "Y" | "N"; // Max         — подключён канал Mango/Max
  property318: "Y" | "N"; // Tg          — подключён Telegram
  property319: "Y" | "N"; // Виджет      — подключён веб-виджет
  property320: "Y" | "N"; // WhatsApp    — подключён WhatsApp
  property321: "Y" | "N"; // VK          — подключён ВКонтакте
}
export interface IVoiceRobotProduct extends ICatalogProduct {

  // ── Каналы коммуникации ────────────────────────────────────────────────────
  productName : "Голосовой робот",
  property310 : { // тариф
    value : string,
    valueEnum : string,
    valuedId : string
  }
  property311 : { // количество линий
    value : string,
    valueEnum : string,
    valuedId : string
  }
}
export interface IVatsProduct extends ICatalogProduct{
    productName : "ВАТС"
}
export interface IWebFormProdruct extends ICatalogProduct{
    productName : "Веб-форма",
    property314 : { // тариф
        value : string,
        valueEnum : string,
        valuedId : string
    }
}
export interface ISmsProduct extends ICatalogProduct{
    productName : "Рассылка в sms" | "Обзвон",
    property309 : { // Канал связи
        value : string,
        valueEnum : string,
        valuedId : string
    }
}
export interface IAutoInfoProduct extends ISmsProduct {
    productName : "Обзвон",
    property308 : { // РР
        value : string,
        valueEnum : string,
        valuedId : string
    }
}

export interface IProductRowDataCreate {
    productName : string,
    price : number
}
export interface IProductCatalogCreate {
    name : string,
    active : "Y" | "N",
}

export interface IVatsProductCreate extends IProductCatalogCreate {}
export interface IChatBotProductCreate extends IProductCatalogCreate, Omit<IChatBotProduct, "productName"> {}
export interface IVoiceRobotProductCreate extends IProductCatalogCreate, Omit<IVoiceRobotProduct, "productName"> {}
export interface IWebFormProdructCreate extends IProductCatalogCreate, Omit<IWebFormProdruct, "productName"> {}
export interface ISmsProductCreate extends IProductCatalogCreate, Omit<ISmsProduct, "productName"> {}
export interface IAutoInfoProductCreate extends IProductCatalogCreate, Omit<IAutoInfoProduct, "productName"> {}

export type AnyProduct = IChatBotProduct | IVoiceRobotProduct | IVatsProduct | IWebFormProdruct | ISmsProduct | IAutoInfoProduct;
export const productRecords = {
    [ProductEnum.AUTOINFO]: {
        iblockId: 15,
        id: 4930,
        name: "Обзвон"
    },
    [ProductEnum.SMS]: {
        iblockId: 15,
        id: 4933,
        name: "Рассылка в sms"
    },
    [ProductEnum.VATS]: {
        iblockId: 15,
        id: 4973,
        name: "ВАТС"
    },
    [ProductEnum.WEB_FORM]: {
        iblockId: 15,
        id: 4967,
        name: "Веб-форма"
    },
    [ProductEnum.VOICE_ROBOT]: {
        iblockId: 15,
        id: 4940,
        name: "Голосовой робот"
    },
    [ProductEnum.CHAT_BOT]: {
        iblockId: 15,
        id: 4965,
        name: "Чат-бот"
    },
}

export const productByParentId: Record<number, ProductEnum> = Object.entries(productRecords)
    .reduce((acc, [key, info]) => {
        acc[info.id] = key as ProductEnum;
        return acc;
    }, {} as Record<number, ProductEnum>);

