
export default defineEventHandler(async (event) => {
    const portal_id = event.context.portal;
    if(!portal_id){
        throw createError({
            statusCode : 401,
            statusMessage : 'Bad Auth'
        })
    }
    const data = await getBitrixTokenByPortal(portal_id.portal.id)
    return {acces_token : data?.access_token};
})