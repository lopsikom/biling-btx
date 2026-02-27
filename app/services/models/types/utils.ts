import type { IAddress } from "../interfaces"

export type DiffAdress = {
    TYPE_ID? : number,
    ENTITY_ID? : number,
    ENTITY_TYPE_ID? : string,
    data : Partial<IAddress>
}

export type DiffWithID<T> ={
    id : string | number | undefined,
    data : Partial<T>
}

export type SelectorObject = {
    value : string | number | boolean | object,
    label : string | number
}
export type ElementType<T> = T extends (infer U)[] ? U : never;