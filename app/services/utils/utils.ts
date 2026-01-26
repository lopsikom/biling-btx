import type { DiffWithID } from "../models";

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function diffObject<T>(
    oldObj : T,
    newObj : T
) : Partial<T> {
    const diff : Partial<T> ={};
    for(const key in newObj){
        const newData = newObj[key];
        const oldData = oldObj[key];
        if(isObject(newData) && isObject(oldData)){
            const nestDiff = diffObject(newData, oldData)
            if(Object.keys(nestDiff).length > 0){
                console.log(key)
                diff[key] = nestDiff as T[typeof key];
            }

        }
        else if (Array.isArray(oldData) && Array.isArray(newData)){
            const arrDiff = diffArray(oldData, newData, "ID");
            if(arrDiff.length > 0) {
                console.log(key)
                diff[key] = arrDiff as T[typeof key];
            }
        }
        else if(!Object.is(oldObj[key], newObj[key])){
            diff[key] = newObj[key];
            console.log(key)
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
