import { useConstant } from "./use-constant.hook";

export interface Service<T> {
    getInstance: () => T;
}

export function useService<T>(s: Service<T>): T {
    const service = useConstant(() => s.getInstance());
    return service;
}
