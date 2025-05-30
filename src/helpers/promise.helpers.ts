import { isFunction } from "./function.helpers";

export function isPromise(value: any): value is Promise<unknown> {
    if(!value) { return false; }
    if(!value.then) { return false; }
    if(!isFunction(value.then)) { return false; }
    return true;
}