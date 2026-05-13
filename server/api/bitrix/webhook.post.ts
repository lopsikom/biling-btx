import { emitBitrixEvent, WebHooksMap } from "~~/server/services/webHooksEvents"
import { IBitrixWebhookPayload } from "~~/shared/models/bitrixModels"
import qs from "qs"

export default defineEventHandler(async (event) => {
    const rawBody = await readRawBody(event)
    const body = qs.parse(rawBody || "") as unknown as IBitrixWebhookPayload<any>
    emitBitrixEvent(body.event as keyof WebHooksMap, body)
})