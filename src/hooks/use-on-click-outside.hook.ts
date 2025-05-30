import { useEffect } from "react";

export function useOnClickOutside(handler: () => void, ref: React.RefObject<HTMLElement|null>|Array<React.RefObject<HTMLElement|null>>) {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (Array.isArray(ref)) {
                if (ref.every(r => r.current && !r.current.contains(event.target as Node))) {
                    handler();
                }
            } else {
                if (ref.current && !ref.current.contains(event.target as Node)) {
                    handler();
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
    
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, handler]);
}