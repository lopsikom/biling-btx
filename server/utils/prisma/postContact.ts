import { contact_emailCreateInput, contact_phonesCreateInput, contactCreateInput } from "~~/server/services/models/generated/prisma/models";
import { prisma } from "~~/server/services/prisma/prismaClient";
import { IContactInfo } from "~~/shared/models/bitrixModels";
import { emailsPhonesMapUpsertPrisma } from "../mappers";

export type ContactWithData = {
    contact : contactCreateInput,
    emails? : IContactInfo[],
    phones? : IContactInfo[]
}

export async function upsertContactWithData(id : number, ...args : ContactWithData[]){
    const response = await Promise.all(args.map(async c => {
        const contact = (await upsertContact(id, c.contact))[0];
        let emails;
        let phones;
        if(c.emails){
            emails = await upsertEmail(id, ...emailsPhonesMapUpsertPrisma(id, contact.id, ...c.emails));
        }
        if(c.phones){
            phones = await upsertPhones(id,...emailsPhonesMapUpsertPrisma(id, contact.id, ...c.phones));
        }
        return {
            contact,
            emails,
            phones
        };
    }))
    return response;
}

export async function upsertContact(id : number, ...args : contactCreateInput[]){
    const response = await Promise.all(args.map(async contact => {
        return await prisma.contact.upsert({
            where : {portal_id_bitrix_id : {
                portal_id : id,
                bitrix_id : contact.bitrix_id
            }},
            update : contact,
            create : contact
        })
    }))
    return response;
}

export async function upsertEmail(id : number, ...args : contact_emailCreateInput[]){
    const response = await Promise.all(args.map(async email => {
        return await prisma.contact_email.upsert({
            where : {portal_id_bitrix_id : {
                portal_id : id,
                bitrix_id : email.bitrix_id
            }},
            update : email,
            create : email
        })
    }));
    return response;
}

export async function upsertPhones(id : number, ...args : contact_phonesCreateInput[]){
    const response = await Promise.all(args.map(async phone => {
        return await prisma.contact_phones.upsert({
            where : {bitrix_id_portal_id : {
                portal_id : id,
                bitrix_id : phone.bitrix_id
            }},
            update : phone,
            create : phone
        })
    }))
    return response
}