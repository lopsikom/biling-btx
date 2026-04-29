import { ProductEnum } from "~~/shared/models/bitrixModels";

const CHAT_BOT_MESSENGER_ENUM: Record<number, { property: string; enumId: number }> = {
    1: { property: "property317", enumId: 119 },
    4: { property: "property318", enumId: 120 },
    2: { property: "property319", enumId: 121 },
    6: { property: "property320", enumId: 122 },
    3: { property: "property321", enumId: 123 },
};

const VOICE_ROBOT_LINES_ENUM: Record<number, number> = {
    1: 91, 3: 92, 5: 93, 7: 94, 10: 95, 15: 96, 20: 97,
    25: 98, 30: 99, 40: 100, 50: 101, 60: 128,
};
const VOICE_ROBOT_LINES_KEYS = [1, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 60];
const VOICE_ROBOT_LINES_MORE_THAN_50 = 102;

function nearestLineEnumId(n: number): number | undefined {
    if (n <= 0) return undefined;
    if (VOICE_ROBOT_LINES_ENUM[n] !== undefined) return VOICE_ROBOT_LINES_ENUM[n];
    if (n > 60) return VOICE_ROBOT_LINES_MORE_THAN_50;
    let best = VOICE_ROBOT_LINES_KEYS[0];
    let minDiff = Math.abs(n - best);
    for (const k of VOICE_ROBOT_LINES_KEYS) {
        const diff = Math.abs(n - k);
        if (diff < minDiff) {
            minDiff = diff;
            best = k;
        }
    }
    return VOICE_ROBOT_LINES_ENUM[best];
}

const VOICE_ROBOT_TARIFF_BASIC = 89;
const VOICE_ROBOT_TARIFF_EXTENDED = 90;

const WEBFORM_TARIFF_STANDARD = 105;
const WEBFORM_TARIFF_INDIVIDUAL = 106;

const AUTOINFO_PROPERTY308_WITHOUT_RR = 84;
const AUTOINFO_PROPERTY308_WITH_RR = 85;
const AUTOINFO_PROPERTY309_DEFAULT = 86;

export type CatalogPropsPayload = Record<string, number | string>;

export function chatBotPropsForCatalog(messengers: number[] | undefined): CatalogPropsPayload | undefined {
    if (!messengers) return undefined;
    const props: CatalogPropsPayload = {};
    for (const messengerInfo of Object.values(CHAT_BOT_MESSENGER_ENUM)) {
        props[messengerInfo.property] = "";
    }
    for (const id of messengers) {
        const enumInfo = CHAT_BOT_MESSENGER_ENUM[id];
        if (enumInfo) props[enumInfo.property] = enumInfo.enumId;
    }
    return props;
}

export function voiceRobotPropsForCatalog(data: { tarrif_id?: number; lines?: number }): CatalogPropsPayload | undefined {
    const props: CatalogPropsPayload = {};
    if (data.tarrif_id !== undefined) {
        props.property310 = data.tarrif_id === 1 ? VOICE_ROBOT_TARIFF_BASIC : VOICE_ROBOT_TARIFF_EXTENDED;
    }
    if (data.lines !== undefined) {
        const enumId = nearestLineEnumId(data.lines);
        if (enumId !== undefined) props.property311 = enumId;
    }
    return Object.keys(props).length ? props : undefined;
}

export function webformPropsForCatalog(data: { tarrif_id?: number }): CatalogPropsPayload | undefined {
    if (data.tarrif_id === undefined) return undefined;
    return {
        property314: data.tarrif_id === 1 ? WEBFORM_TARIFF_STANDARD : WEBFORM_TARIFF_INDIVIDUAL,
    };
}

export function autoinformationProductTypeByTypeId(type_id: number): ProductEnum {
    return type_id === 3 ? ProductEnum.SMS : ProductEnum.AUTOINFO;
}

export function autoinformationPropsForCatalog(type_id: number | undefined): CatalogPropsPayload | undefined {
    if (type_id === undefined) return undefined;
    const props: CatalogPropsPayload = { property309: AUTOINFO_PROPERTY309_DEFAULT };
    if (type_id === 1) props.property308 = AUTOINFO_PROPERTY308_WITHOUT_RR;
    else if (type_id === 2) props.property308 = AUTOINFO_PROPERTY308_WITH_RR;
    return props;
}
