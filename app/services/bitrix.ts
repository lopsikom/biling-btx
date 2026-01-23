import type { B24Frame } from '@bitrix24/b24jssdk'
import type { IAddress, IAddresType, ICompnany, IContact, IField, IRequisite, IUser, IUserField } from '~/services/models'

export class Bitrix {
    public bitrixFrame : B24Frame

    constructor(frame : B24Frame){
        this.bitrixFrame = frame
    }
    async companyFields() : Promise<IField[]>{
        return (await this.bitrixFrame.callMethod("crm.company.fields", {})).getData().result as IField[]
    }
    async companyUserFields() : Promise<IUserField[]>{
        return (await this.bitrixFrame.callMethod("crm.company.userfield.list", {})).getData().result as IUserField[]
    }
    async companyInfo(id? : number) : Promise<ICompnany>{
        console.log(this.bitrixFrame.placement.options.ID)
        return (await this.bitrixFrame.callMethod("crm.company.get", {
            id : id ?? this.bitrixFrame.placement.options.ID
        })).getData().result as ICompnany
    }
    async companyContacts(id? : number) : Promise<IContact[]>{
        return ( await this.bitrixFrame.callMethod("crm.contact.list", {
            filter : {
                COMPANY_ID : id ?? this.bitrixFrame.placement.options.ID
            },
            select : [
                "ID",
                "NAME",
                "LAST_NAME",
                "SECOND_NAME",
                "PHONE",
                "EMAIL",
                "POST"
            ]
        })).getData().result as IContact[];
    }
    async companyRequisite(id? : number) : Promise<IRequisite[]> {
        return (await this.bitrixFrame.callMethod("crm.requisite.list", {
            filter : {
                ENTITY_ID : id ?? this.bitrixFrame.placement.options.ID
            }
        })).getData().result as IRequisite[];
    }
    async getUser(id : number) : Promise<IUser[]> {
        return (await this.bitrixFrame.callMethod("user.get", {
            ID : id
        })).getData().result as IUser[]
    }
    async companyAdress(id? : number) : Promise<IAddress[]>{
        return (await this.bitrixFrame.callMethod("crm.address.list", {
            filter : {
                ENTITY_TYPE_ID : 4,
                ENTITY_ID :id ?? this.bitrixFrame.placement.options.ID
            }
        })).getData().result as IAddress[]
    }
    async companyUpdate(data : any){
       return (await this.bitrixFrame.callMethod("crm.company.update", {
            "id" : this.bitrixFrame.placement.options.ID,
            "fields" : data
        })).getData().result;
    }
    async getAddresTypes() : Promise<IAddresType[]>{
        return (await this.bitrixFrame.callMethod("crm.enum.addresstype")).getData().result as IAddresType[]
    }
    
}

export default async function initBitrix() : Promise<Bitrix>{
    const {$initializeB24Frame} = useNuxtApp()
    const frame = await $initializeB24Frame()
    return new Bitrix(frame)
}