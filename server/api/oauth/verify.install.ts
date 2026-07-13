import getPortalByUserBitrix from "~~/server/utils/prisma/getPortalByUserBitrix";

// Лёгкая проверка перед формой привязки на установке: портал уже заведён
// в БД (создан при обмене OAuth-кодом) и токен рабочий. Первичный sync
// компаний/юзеров — отдельным шагом, см. portal/sync.post.ts, вызывается
// после того, как админ сохранит привязку (смарт-процесс + раздел каталога).
export default defineEventHandler(async (event) =>{
    const token = getHeader(event, "Authorization");
    if(!token){
        throw createError({
            statusCode: 401,
            statusMessage: 'Empty token'
        })
    }
    try{
        const portal = await getPortalByUserBitrix(token);
        if(!portal){
            return false
        }
        if(!portal.portal.refresh_token) {
            return false
        }
        return true
    }catch(e){
        console.error(e)
        throw createError({
            statusCode: 500,
            statusMessage: "Error"
        })
    }
})