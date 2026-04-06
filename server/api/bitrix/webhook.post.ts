export default defineEventHandler(async (event) => {
    console.log(readBody(event))
})