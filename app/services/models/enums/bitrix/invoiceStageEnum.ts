export const invoiceStage : Record<string, string> = {
    "DT31_1:N" : "Новый",
    "DT31_1:S" : "Отправлен клиенту",
    "DT31_1:P" : "Оплачено",
    "DT31_1:U" : "Не оплачено"
};

export enum invoiceStageEnum {
    "DT31_1:N" = "NEW",
    "DT31_1:S" = "SEND-CLIENT",
    "DT31_1:P" = "PAY",
    "DT31_1:U" = "UNPAY"
};
