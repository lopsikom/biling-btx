import syncService from "../services/syncService";

export default defineEventHandler(async (event) => {

    await syncService.installSync(4)

    return true
})