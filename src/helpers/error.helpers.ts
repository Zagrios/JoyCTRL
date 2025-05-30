import { isPromise } from "./promise.helpers";

type TryitReturn<Return> = Return extends Promise<any> ? Promise<{ error: Error | null, result: Awaited<Return> | null }> : { error: Error | null, result: Return | null };

export function tryit<Return>(func: () => Return): TryitReturn<Return> {
    try {
        const result = func();

        if(isPromise(result)){
            return result
                .then((value) => ({ error: null, result: value }))
                .catch((err) => ({ error: err instanceof Error ? err : new Error(`${err}`), result: null })) as TryitReturn<Return>;
        }

        return { error: null, result } as TryitReturn<Return>;

    } catch (err) {
        return { error: err, result: null } as TryitReturn<Return>;
    }
}
