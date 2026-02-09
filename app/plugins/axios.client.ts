import { axiosClient } from "~/services/axiosClient"

export default defineNuxtPlugin(() => {
    const axios = new axiosClient()
    return{
        provide: {
            axios
        }
    }
})