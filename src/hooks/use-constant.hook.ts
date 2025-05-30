import { useRef } from "react";

export function useConstant<T>(initialValue: (() => T)|T): T {
    const ref = useRef<T>(null);
    if (!ref.current) {
        ref.current = typeof initialValue === 'function' 
            ? (initialValue as () => T)() 
            : initialValue;
    }
    return ref.current as T;
}
