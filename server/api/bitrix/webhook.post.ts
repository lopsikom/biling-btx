import { emitBitrixEvent, webHookEmmiter, WebHooksMap } from "~~/server/services/webHooksEvents"
import { Bitrix24Event, IBitrixWebhookPayload } from "~~/shared/models/bitrixModels"
import qs from "qs"

export default defineEventHandler(async (event) => {
    const rawBody = await readRawBody(event)
    const body = qs.parse(rawBody || "") as unknown as IBitrixWebhookPayload<any>
    console.log(event)
    const clientIp =
            getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim()
            ?? event.node.req.socket.remoteAddress
            ?? ''
    console.log("host ", clientIp)
    console.log(body)
    console.log(body.data)
    emitBitrixEvent(body.event as keyof WebHooksMap, body)
})