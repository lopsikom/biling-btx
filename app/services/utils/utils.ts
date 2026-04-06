import { useClipboard } from "@vueuse/core";
import type { DiffWithID, IEventBitrix } from "../models";
import useToastStore from "../stores/toastStore";
import type { B24Frame } from '@bitrix24/b24jssdk'
import type { bitrixResponse } from "~~/server/services/bitrix/bitrixAPI";

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function diffObject<T>(
    oldObj : T,
    newObj : T,
    withID = true
) : Partial<T> {
    const diff : Partial<T> ={};
    for(const key in newObj){
        const newData = newObj[key];
        const oldData = oldObj[key];
        if(isObject(newData) && isObject(oldData)){
            
            const nestDiff = diffObject(oldData, newData)
            if(Object.keys(nestDiff).length > 0){
                diff[key] = nestDiff as T[typeof key];
            }

        }
        else if (Array.isArray(oldData) && Array.isArray(newData)){
            let arrDiff;
            if(withID) arrDiff = diffArray(oldData, newData, "ID");
            else arrDiff = diffArray(oldData, newData);
            if(arrDiff.length > 0) {
                diff[key] = arrDiff as T[typeof key];
            }
        }
        else if(!Object.is(oldObj[key], newObj[key])){    
            diff[key] = newObj[key];
        }
    }
    
    return diff;
}
export function diffArray<T>(
    oldArray : T[],
    newArray : T[]
) : Partial<T>[];

export function diffArray<T, K extends keyof T>(
    oldArray : T[],
    newArray : T[],
    KeyField : K
): DiffWithID<T>[];

export function diffArray<T, K extends keyof T>(
    oldArray : T[],
    newArray : T[],
    KeyField? : K
) : (DiffWithID<T> | Partial<T>)[] {
    const diff : (DiffWithID<T> | Partial<T>)[] = [];
    newArray.forEach((n , i) => {
        const diffobj = diffObject(oldArray[i],n);
        if(Object.keys(diffobj!).length > 0) {
            if(KeyField){
                const id = n[KeyField] as string | number | undefined;
                diff.push({
                    id,
                    data : diffobj!
                })
            }
            else{
                diff.push(diffobj!)
            }
        }
    })
    return diff;
}

export function isDiffArraySimple<T>(oldArray : T[], newArray : T[]) {
    
    if (oldArray.length !== newArray.length) {
        
        return true;
    }

    const sorted1 = [...oldArray].sort();
    const sorted2 = [...newArray].sort();

    for (let i = 0; i < sorted1.length; i++) {
        
        if (sorted1[i] !== sorted2[i]) {
            
            return true;
        }
    }

    return false;
}
const {copy} = useClipboard()
export async function copyToClipboard(text : string) {
  try{
    await copy(text);
    useToastStore().openToast("Текст скопирован");
  }catch(e){
    console.log(e)
  }
}

export function makeKey(...args : string[]){
    return args.join("::")
}
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
export function isValidData(obj: Record<string, any>): boolean {
    for (const key in obj) {
        const value = obj[key];
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === "string" && value.trim() === "") {
            return false;
        }

        if (typeof value === "number" && value <= 0) {
            if(key !== "id" && key !== "contract_id" && key !== "index" && key !=="company_id") return false;
        }
    }

    return true;
}

export function reloadFrame(){
    window.location.reload()
}

export async function unbindAllEvent(frame : B24Frame){
    const event = (await frame.callMethod("event.get")).getData() as bitrixResponse<IEventBitrix[]>
    await Promise.all(event.result.map(async e => {
        frame.callMethod("event.unbind", {
            event : e.event,
            handler : e.handler
        })
    }))
}