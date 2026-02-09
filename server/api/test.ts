export default defineEventHandler((event) => {
    return {
        id : event.context.portal.id,
        domain : event.context.portal.domain
    }
})