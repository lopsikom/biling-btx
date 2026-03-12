import { EventEmitter } from "events";
import { postEventPrisma } from "../utils/prisma/Event";

export const eventsAudit =  new EventEmitter()

eventsAudit.on("entity.create", async (data : EventEntity) => {
    await postEventPrisma({
        action : "create",
        entity : data.entity,
        entityName : data.entityName,
        user_bitrix : {connect : {id : data.userid}}
    })
})
eventsAudit.on("entity.update", async (data : EventEntity) => {
    await postEventPrisma({
        action : "update",
        entity : data.entity,
        entityName : data.entityName,
        user_bitrix : {connect : {id : data.userid}}
    })
})
eventsAudit.on("entity.delete", async (data : EventEntity) => {
    await postEventPrisma({
        action : "delete",
        entity : data.entity,
        entityName : data.entityName,
        user_bitrix : {connect : {id : data.userid}}
    })
})

export type EventEntity = {
    userid : number,
    entity : string,
    entityName : string
}