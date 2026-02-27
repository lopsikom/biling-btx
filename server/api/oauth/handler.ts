
export default defineEventHandler(async (event) => {
    console.log("adaawdawdawdawdwd")
    const query = getQuery(event);
    const code = query.code;
    const domain = query.domain;
    const server_domain = query.server_domain;
    console.log(query)
    if(code && domain && server_domain){
        try{
            const data = await getBitrixTokenByCode(code.toString(), domain.toString(), server_domain.toString());
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