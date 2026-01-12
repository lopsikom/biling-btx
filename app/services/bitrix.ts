import type { B24Frame } from '@bitrix24/b24jssdk'
import type { ICompnany, IField, IUserField } from '@models'

export class Bitrix {
    public bitrixFrame : B24Frame

    constructor(frame : B24Frame){
        this.bitrixFrame = frame
    }
    async companyFields() : Promise<IField[]>{
        return (await this.bitrixFrame.callMethod("crm.company.fields", {})).getData().result as IField[]
    }
    async companyInfo() : Promise<ICompnany>{
        console.log(this.bitrixFrame.placement.options.ID)
        return (await this.bitrixFrame.callMethod("crm.company.get", {
            id : this.bitrixFrame.placement.options.ID
        })).getData().result as ICompnany
    }
    async companyUpdate(data : any){
        await this.bitrixFrame.callMethod("crm.company.update", {
            "id" : this.bitrixFrame.placement.options.ID,
            "fields" : data
        })
    }
    async companyUserFields() : Promise<IUserField[]>{
        return (await this.bitrixFrame.callMethod("crm.company.userfield.list", {})).getData().result as IUserField[]
    }
}

export default async function initBitrix() : Promise<Bitrix>{
    const {$initializeB24Frame} = useNuxtApp()
    const frame = await $initializeB24Frame()
    return new Bitrix(frame)
}