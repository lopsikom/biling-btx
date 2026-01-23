
import type { IAddress, IAddresType, ICompnany, IContact, IRequisite, IUser } from "../models"

export const mockCompany : ICompnany = {
  ID: 1,
  COMPANY_TYPE: "CLIENT",
  TITLE: "ООО Ромашка",


  HAS_PHONE: "Y",
  HAS_EMAIL: "Y",
  HAS_IMOL: "N",

  ASSIGNED_BY_ID: 10,
  CREATED_BY_ID: 10,
  MODIFY_BY_ID: 12,

  BANKING_DETAILS: "Р/с 40702810900000000001",
  INDUSTRY: "IT",

  REVENUE: 1500000,
  CURRENCY_ID: "RUB",
  EMPLOYEES: "50-100",

  COMMENTS: "Ключевой клиент",

  DATE_CREATE: "2025-01-10T09:30:00",
  DATE_MODIFY: "2025-01-15T14:45:00",

  OPENED: "Y",
  IS_MY_COMPANY: "Y",


  ADDRESS: "ул. Ленина, д. 10",
  ADDRESS_CITY: "Москва",
  ADDRESS_POSTAL_CODE: "101000",
  ADDRESS_REGION: "Московская область",
  ADDRESS_COUNTRY: "Россия",
  ADDRESS_COUNTRY_CODE: "RU",

  ADDRESS_LEGAL: "г. Москва, ул. Ленина, д. 10",

  REG_ADDRESS: "г. Москва, ул. Ленина, д. 10",
  REG_ADDRESS_CITY: "Москва",
  REG_ADDRESS_POSTAL_CODE: "101000",
  REG_ADDRESS_REGION: "Московская область",
  REG_ADDRESS_COUNTRY: "Россия",
  REG_ADDRESS_COUNTRY_CODE: "RU",

  UTM_SOURCE: "google",
  UTM_MEDIUM: "cpc",
  UTM_CAMPAIGN: "winter_sale",
  UTM_TERM: "crm system",

  LAST_ACTIVITY_BY: 12,
  LAST_ACTIVITY_TIME: "2026-01-20T16:30:00",
  LAST_COMMUNICATION_TIME: "2025-01-16T11:25:00",

  USER_FIELDS: [],
  LOGO: undefined,
  LEAD_ID: undefined,
  ORIGINATOR_ID: undefined,
  ORIGIN_ID: undefined,
  ORIGIN_VERSION: undefined,
  ADDRESS_2: undefined,
  ADDRESS_PROVINCE: undefined,
  ADDRESS_LOC_ADDR_ID: undefined,
  REG_ADDRESS_2: undefined,
  REG_ADDRESS_PROVINCE: undefined,
  REG_ADDRESS_LOC_ADDR_ID: undefined,
  UTM_CONTENT: undefined
};
export const mockRequisite: IRequisite[] = [
    {
      ID : 1,
  ENTITY_TYPE_ID: 4,
  ENTITY_ID: 1,
  PRESET_ID: 1,
  NAME: "Основные реквизиты",
  CODE: "MAIN",
  RQ_INN: "7701234567",
  RQ_KPP: "770101001",
  RQ_IFNS: "7701",
  RQ_OGRN: "1027700132195",
  RQ_OKPO: "12345678"
}
];
export const mockContact: IContact[] = [
    {
  ID: 100,
  POST: "Менеджер по закупкам",
  NAME: "Иван",
  SECOND_NAME: "Иванович",
  LAST_NAME: "Петров",
  LEAD_ID: 50,
  TYPE_ID: "CLIENT",
  SOURSCE_ID: "WEB",
  COMPANY_ID: 1,
  DATE_CREATE: "2025-01-12T10:00:00",
  ASSIGNED_BY_ID: 10,
  CREATED_BY_ID: 10,
  PHONE: [
    {
    ID : 1,
    TYPE_ID : "PHONE",
    VALUE_TYPE : "WORK",
    VALUE : "+79991234567"
  },
  {
    ID : 2,
    TYPE_ID : "PHONE",
    VALUE_TYPE : "HOME",
    VALUE : "+79993234567"
  }
  ],
  EMAIL: [
        {
    ID : 1,
    TYPE_ID : "EMAIL",
    VALUE_TYPE : "WORK",
    VALUE : "iVAN.petrov@yandex.com"
  },
  {
    ID : 2,
    TYPE_ID : "EMAIL",
    VALUE_TYPE : "HOME",
    VALUE : "arbuzov.petrov@example.com"
  }
  ]
},
{
      ID: 12,
  POST: "Директор",
  NAME: "Вася",
  SECOND_NAME: "Иванович",
  LAST_NAME: "Петров",
  LEAD_ID: 50,
  TYPE_ID: "CLIENT",
  SOURSCE_ID: "WEB",
  COMPANY_ID: 1,
  DATE_CREATE: "2025-01-12T10:00:00",
  ASSIGNED_BY_ID: 10,
  CREATED_BY_ID: 10,
 PHONE: [
    {
    ID : 1,
    TYPE_ID : "PHONE",
    VALUE_TYPE : "WORK",
    VALUE : "+79991234567"
  },
  {
    ID : 2,
    TYPE_ID : "PHONE",
    VALUE_TYPE : "HOME",
    VALUE : "+79993234567"
  }
  ],
  EMAIL: [
        {
    ID : 1,
    TYPE_ID : "EMAIL",
    VALUE_TYPE : "WORK",
    VALUE : "iVAN.petrov@yandex.com"
  },
  {
    ID : 2,
    TYPE_ID : "EMAIL",
    VALUE_TYPE : "HOME",
    VALUE : "arbuzov.petrov@example.com"
  }
  ]
}
]
export const mockUser: IUser = {
  ID: 10,
  NAME: "Алексей",
  LAST_NAME: "Сидоров",
  SECOND_NAME: "Олегович",
  EMAIL: "a.sidorov@company.ru",
  LAST_LOGIN: "2025-01-16T08:55:00",
  IS_ONLINE: "Y",
  WORK_PHONE: "+7 495 000-00-00",
  WORK_POSITION: "CRM администратор",
  ACTIVE: true
};

export const mockAddress : IAddress[] = [
  {
  TYPE_ID: 6,
  ENTITY_TYPE_ID: 8,
  ENTITY_ID: 7,
  ADDRESS_2: "Санкт-Петербург, Приморский проспект, 151",
},
{
  TYPE_ID: 11,
  ENTITY_TYPE_ID: 8,
  ENTITY_ID: 5,
  ADDRESS_1: "улица Фатыха Амирхана, 15",
  CITY: "Казань",
  POSTAL_CODE: 420126,
  COUNTRY: "Россия",

}
]
export const mockAddressTypes: IAddresType[] = [
  {
    ID: 11,
    NAME: "Адрес доставки",

  },
  {
    ID: 1,
    NAME: "Фактический адрес",

  },
  {
    ID: 6,
    NAME: "Юридический адрес",

  },
  {
    ID: 4,
    NAME: "Адрес регистрации",


  },
  {
    ID: 8,
    NAME: "Адрес для корреспонденции",

  },
  {
    ID: 9,
    NAME: "Адрес бенефициара",

  },
];