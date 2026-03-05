export const invoiceStage : Record<string, string> = {
    "N" : "Новый",
    "S" : "Отправлен клиенту",
    "P" : "Оплачено",
    "U" : "Не оплачено"
};

export enum invoiceStageEnum {
    "N" = "NEW",
    "S" = "SEND-CLIENT",
    "P" = "PAY",
    "U" = "UNPAY"
};
