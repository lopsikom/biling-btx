export default defineEventHandler(async (event) => {
    const tarrifs = await getTariffs();
    return tarrifs;
})