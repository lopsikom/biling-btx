import type { B24Frame } from '@bitrix24/b24jssdk'
import type { DiffAdress, IAddress, IAddresType, ICompnany, IContact, IField, Invoice, IRequisite, IUser, IUserField } from '~/services/models'

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
    async companyInfo(id? : string | number) : Promise<ICompnany>{
        console.log(this.bitrixFrame.placement.options.ID)
        return (await this.bitrixFrame.callMethod("crm.company.get", {
            id : id ?? this.bitrixFrame.placement.options.ID
        })).getData().result as ICompnany
    }
    async companyContacts(id? : string | number) : Promise<IContact[]>{
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
    async companyRequisite(id? : string | number) : Promise<IRequisite[]> {
        return (await this.bitrixFrame.callMethod("crm.requisite.list", {
            filter : {
                ENTITY_TYPE_ID : 4,
                ENTITY_ID : id ?? this.bitrixFrame.placement.options.ID
            }
        })).getData().result as IRequisite[];
    }
    async getUser(id : string | number) : Promise<IUser[]> {
        return (await this.bitrixFrame.callMethod("user.get", {
            ID : id
        })).getData().result as IUser[]
    }
    async companyAdress(id? : string | number) : Promise<IAddress[]>{
        return (await this.bitrixFrame.callMethod("crm.address.list", {
            filter : {
                ENTITY_TYPE_ID : 4,
                ENTITY_ID : id ?? this.bitrixFrame.placement.options.ID
            }
        })).getData().result as IAddress[]
    }
    async getAddresTypes() : Promise<IAddresType[]>{
        return (await this.bitrixFrame.callMethod("crm.enum.addresstype")).getData().result as IAddresType[]
    }
    async companyUpdate(data : Partial<ICompnany>, id? : string | number){
       return (await this.bitrixFrame.callMethod("crm.company.update", {
            id : id ?? this.bitrixFrame.placement.options.ID,
            fields : data
        })).getData();
    }
    async updateAdress(data : DiffAdress){
        return (await this.bitrixFrame.callMethod("crm.address.update", {
            fields: {
                TYPE_ID : data.TYPE_ID,
                ENTITY_TYPE_ID : data.ENTITY_TYPE_ID,
                ENTITY_ID : data.ENTITY_ID,
                ADDRESS_1 : "",
                ADDRESS_2 : data.data.ADDRESS_2,
                CITY : "",
                POSTAL_CODE : "",
                REGION : "",
                PROVINCE : "",
                COUNTRY : ""
            }
        })).getData();
    }
    async deleteAddress(data : DiffAdress){
        return (await this.bitrixFrame.callMethod("crm.address.delete",
            {
            fields : {
                TYPE_ID : data.TYPE_ID,
                ENTITY_TYPE_ID : data.ENTITY_TYPE_ID,
                ENTITY_ID : data.ENTITY_ID
            }
        })).getData();
    }
    async updateRequisite(data : Partial<IRequisite>, id? : number | string){
        return (await this.bitrixFrame.callMethod("crm.requisite.update", {
            id : id,
            fields : data
        })).getData();
    } 
    async updateContact(data : Partial<IContact>, id : number | string){
        return (await this.bitrixFrame.callMethod("crm.contact.update", {
            id : id,
            fields : data
        })).getData();
    }
    async getInvoice(id? : number){
        return (await this.bitrixFrame.callMethod("crm.item.list",{
        entityTypeId : 31,
        filter : {
            companyId : id ?? this.bitrixFrame.placement.options.ID
        }
    })).getData().result.items as Invoice[];
    }
    
}

export default async function initBitrix(frame? : B24Frame) : Promise<Bitrix>{
    if(!frame) {
        const {$initializeB24Frame} = useNuxtApp()
        frame = await $initializeB24Frame()
    }
    const bitrixClient = new Bitrix(frame);
    if(!bitrixClient.bitrixFrame.placement.isSliderMode){
        const size = bitrixClient.bitrixFrame.parent.getScrollSize()
        const height = window.screen.height * 0.666
        console.log(height)
        bitrixClient.bitrixFrame.parent.resizeWindow(size.scrollWidth, height)
    }
    return bitrixClient
}