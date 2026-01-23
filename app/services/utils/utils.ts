import type { DiffWithID } from "../models";

export function diffObject<T>(
    oldObj : T,
    newObj : T
) : Partial<T> {
    const diff : Partial<T> ={};
    for(const key in newObj){
        if(!Object.is(oldObj[key], newObj[key])){
            
            diff[key] = newObj[key];
            console.log(key)
        }
    }

    return diff;
}

export function diffArray<T>(
    oldArray : T[],
    newArray : T[],
    KeyField : keyof T
) : DiffWithID<T>[] {
    const diff : DiffWithID<T>[] = [];
    newArray.forEach((n , i) => {
        const diffobj = diffObject(oldArray[i],n);
        if(Object.keys(diffobj!).length > 0) {
            const id = n[KeyField] as string | number | undefined;
            diff.push({
                id,
                data : diffobj!
            })
        }
    })
    return diff;
}
