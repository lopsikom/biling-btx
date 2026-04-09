import { emitBitrixEvent, webHookEmmiter, WebHooksMap } from "~~/server/services/webHooksEvents"
import { Bitrix24Event, IBitrixWebhookPayload } from "~~/shared/models/bitrixModels"

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as IBitrixWebhookPayload<any>
    emitBitrixEvent(body.event as keyof WebHooksMap, body)
})