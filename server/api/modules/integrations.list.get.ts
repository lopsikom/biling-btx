import { getIntegrations } from "~~/server/utils/prisma/modules/WebForm";

export default defineEventHandler(async (event) => {
    const integrations = await getIntegrations();
    return integrations;
})