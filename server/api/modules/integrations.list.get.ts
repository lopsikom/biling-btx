export default defineEventHandler(async (event) => {
    const integrations = await getIntegrations();
    return integrations;
})