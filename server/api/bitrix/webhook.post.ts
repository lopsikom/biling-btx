export default defineEventHandler(async (event) => {
    console.log(await readBody(event))
})