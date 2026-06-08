import type { B24Frame } from '@bitrix24/b24jssdk'
import type { Bitrix24Placement, DiffAdress, IAddress, IAddresType, ICompnany, IContact, IDeal, IField, Invoice, IRequisite, IResponseArrayNewBitrix, IResponseNewBitrix, IStage, IUser, IUserField } from '~/services/models'
import { BitrixPlacementMap } from './axiosClient'

export class Bitrix {
    private companyId : string | null
    public bitrixFrame : B24Frame

    constructor(frame : B24Frame){
        this.bitrixFrame = frame
        this.companyId = null;
    }
    async companyFields() : Promise<IField[]>{
        return (await this.bitrixFrame.callMethod("crm.company.fields", {})).getData().result as IField[]
    }
    async companyUserFields() : Promise<IUserField[]>{
        return (await this.bitrixFrame.callMethod("crm.company.userfield.list", {})).getData().result as IUserField[]
    }
    async companyInfo(id? : string | number) : Promise<ICompnany>{
        return (await this.bitrixFrame.callMethod("crm.company.get", {
            id : id ?? await this.getCompanyId()
        })).getData().result as ICompnany
    }
    async getCompanyId(){
        if(!this.companyId){
            const id = await BitrixPlacementMap[this.bitrixFrame.placement.title as Bitrix24Placement](this.bitrixFrame);
            this.companyId = id;
        }
        return this.companyId;
    }
    async getItems<T>(entityTypeId : string | number, filter? : object){
        return (await this.bitrixFrame.callMethod("crm.item.list",{
        entityTypeId,
        filter 
    })).getData() as IResponseArrayNewBitrix<T>
    }
    async companyContacts(id? : string | number) : Promise<IContact[]>{
        return ( await this.bitrixFrame.callMethod("crm.contact.list", {
            filter : {
                COMPANY_ID : id ?? await this.getCompanyId()
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
                ENTITY_ID : id ?? await this.getCompanyId()
            }
        })).getData().result as IRequisite[];
    }
    async getUser(id : string | number) : Promise<IUser[]> {
        return (await this.bitrixFrame.callMethod("user.get", {
            ID : id
        })).getData().result as IUser[]
    }
    async getUsers(data? : {filter? : object, order? : object, pagination : number}){
        const response = await this.bitrixFrame.callMethod("user.get", {
            filter : data?.filter,
            order : data?.order,
            start : data?.pagination
        })
        return response.getData().result as IUser[]
    }
    async companyAdress(id? : string | number) : Promise<IAddress[]>{
        return (await this.bitrixFrame.callMethod("crm.address.list", {
            filter : {
                ENTITY_TYPE_ID : 4,
                ENTITY_ID : id ?? await this.getCompanyId()
            }
        })).getData().result as IAddress[]
    }
    async getAddresTypes() : Promise<IAddresType[]>{
        return (await this.bitrixFrame.callMethod("crm.enum.addresstype")).getData().result as IAddresType[]
    }
    async companyUpdate(data : Partial<ICompnany>, id? : string | number){
       return (await this.bitrixFrame.callMethod("crm.company.update", {
            id : id ?? await this.getCompanyId(),
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
            companyId : id ?? await this.getCompanyId()
        }
    })).getData().result.items as Invoice[];
    }
    async getStage(id : number, data? : {filter? : object, order? : object, select? : string[], start? : number }){
        const response = await this.bitrixFrame.callMethod("crm.stagehistory.list", {
            entityTypeId : id,
            filter : data?.filter,
            order : data?.order,
            select : data?.select,
            start : data?.start
        })
        return response.getData() as IResponseArrayNewBitrix<IStage>
    }
    async getDeals(data? : {filter? : object, order? : object, select? : string[], start? : number }){
        const response = await this.bitrixFrame.callMethod("crm.deal.list", {
            filter : {...data?.filter, "COMPANY_ID" : await this.getCompanyId()},
            order : data?.order,
            start : data?.start
        })
        return response.getData().result as IDeal[]
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
        const height = window.screen.height * 0.7
        console.log(height)
        bitrixClient.bitrixFrame.parent.resizeWindow(size.scrollWidth, height)
    }
    return bitrixClient
}