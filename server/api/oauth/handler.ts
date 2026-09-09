import { fault, refusal } from '~~/server/utils/errors'
import { isError } from 'h3'

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code;
    const server_domain = query.server_domain;
    const state = query.state;  
    if(code && state && server_domain){
        try{
            const data = await getBitrixTokenByCode(code.toString(), server_domain.toString(), Number(state));
            if(!data) {
                throw refusal('validation.failed', 400, { message: 'Bitrix не выдал токен по этому коду' })
            }
            setResponseStatus(event, 202)
            return data 
            
        }
        catch(e){
            // Свой же отказ выше не должен превращаться в безликий 500 (ADR-0009)
            if(isError(e)) throw e
            throw fault('internal', { message: 'Не удалось завершить установку приложения', cause: e })
        }
    }
    else{
        throw refusal('validation.failed', 400, { message: 'В запросе нет code, state или server_domain' })
    }
})