
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code;
    const server_domain = query.server_domain;
    const state = query.state;  
    console.log("state ", state)
    if(code && state && server_domain){
        try{
            const data = await getBitrixTokenByCode(code.toString(), server_domain.toString(), Number(state));
            if(!data) {
                throw createError({
                    status : 400,
                    statusMessage : "Bad Request"
                })
            }
            setResponseStatus(event, 202)
            console.log(data);
            return data 
            
        }
        catch(e){
            console.error(e)
            throw createError({
                status : 500,
                statusText : 'Server error'
            })
        }
    }
    else{
        throw createError({
            status : 400,
            statusText: 'invalid code'
        }) 
    }
})