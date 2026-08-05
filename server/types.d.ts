import { AuthedPortalDataType } from "./utils/prisma/getPortalByUserBitrix"


declare module 'h3' {
    interface H3EventContext {
        portal : AuthedPortalDataType
    }
}

export {}