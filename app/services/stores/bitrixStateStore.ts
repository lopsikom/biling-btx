import { Bitrix } from "../bitrix"
import type { B24Frame } from '@bitrix24/b24jssdk'
import { type IContact, type IRequisite, type IUser, type ICompnany, type IAddresType, type IAddress, type AddressType, type Invoice } from "../models"

const useBitrixStateStore = defineStore('bitrixState', () => {

    let bitrixClient : Bitrix | undefined = undefined;

    const bitrixCompany = ref<ICompnany>();
    const companyContacts = ref<IContact[]>();
    const companyRequisite = ref<IRequisite[]>();
    const companyAssignUser = ref<IUser>();
    const companyAddress = ref<IAddress[]>(); // Поменять на enum
    const companyInvoice = ref<Invoice[]>();
    
    const addresTypes = ref<IAddresType[]>();


    const addressesNormalized = computed<AddressType[]>(() =>{
        if(!companyAddress.value) return [];
        return companyAddress.value.map(i => {
            const addressTitle = addresTypes.value?.find(t => t.ID.toString() === i.TYPE_ID.toString())?.NAME ?? "Адрес";
            return {
                title : addressTitle,
                addres : i.ADDRESS_2 ??
                [
                    i.POSTAL_CODE,
                    i.COUNTRY,
                    i.REGION,
                    i.PROVINCE,
                    i.CITY,
                    i.ADDRESS_1
                ].filter(Boolean)
                .join(', ')
            };
            
        })
    })

    function getDateCreate(){
        const date = new Date(bitrixCompany.value?.DATE_CREATE ?? "").toLocaleDateString().split('.')
        return date[0] !== "Invalid Date" ? date.filter(Boolean).join('-') : '00-00-0000';
    }
    function getShortName(item : IUser | IContact | undefined) : string{
        if(!item) return '';
        const last_name = item.LAST_NAME;
        if(last_name){
            const shortTitle = [
            item.NAME,
            item.SECOND_NAME
            ].filter(Boolean)
            .map(i => i![0])
            .join('.');
            return `${last_name} ${shortTitle}.`;
        }
        else{
            return `${item.NAME} ${item.SECOND_NAME}`
        }
    }
    function lastActivityCompany(){
         if(!bitrixCompany.value ) return;
        const lastActivityDate = new Date(bitrixCompany.value.LAST_ACTIVITY_TIME);
        const dateNow = new Date();
        const dateInterval = dateNow.getTime() - lastActivityDate.getTime();
        if(dateInterval < 60000)return `${(dateInterval / 1000).toFixed()} секунд назад`;
        else if (dateInterval < 3600000) return `${(dateInterval / 60000).toFixed()} минут назад`;
        else if (dateInterval < 86400000) return `${(dateInterval / 3600000).toFixed()} часов назад`;
        else {
            const date = new Date(bitrixCompany.value?.LAST_ACTIVITY_TIME ?? "").toLocaleDateString().split('.')   
            return date.join('-');
        }
    }
    function lastActivityAssignUser(){
        if(!companyAssignUser.value ) return;
        const lastActivityDate = new Date(companyAssignUser.value.LAST_LOGIN ?? "");
        const dateNow = new Date();
        const dateInterval = dateNow.getTime() - lastActivityDate.getTime();
        if(dateInterval < 60000)return `${(dateInterval / 1000).toFixed()} секунд назад`;
        else if (dateInterval < 3600000) return `${(dateInterval / 60000).toFixed()} минут назад`;
        else if (dateInterval < 86400000) return `${(dateInterval / 3600000).toFixed()} часов назад`;
        else {
            const date = new Date(companyAssignUser.value?.LAST_LOGIN ?? "").toLocaleDateString().split('.')   
            return `${date[2]}-${date[1]}-${date[0]}`
        }
    }

    function setBitrixClient(bitrix : Bitrix){
        bitrixClient = bitrix
    }
    function getBitrixClient(){
        return bitrixClient
    }
    
    return {
        bitrixCompany,
        companyContacts,
        companyAssignUser,
        companyRequisite,
        companyAddress,
        companyInvoice,
        addresTypes,
        addressesNormalized,
        getDateCreate,
        getShortName,
        lastActivityCompany,
        lastActivityAssignUser,
        getBitrixClient,
        setBitrixClient
    };

})

export default useBitrixStateStore;