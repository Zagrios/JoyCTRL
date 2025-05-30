import { useEffect } from "react";

let priorityQueue: string[] = [];

export function useOnKeyUp(tag: string, handler: (e?: KeyboardEvent) => void, keys?: string[]) {
    useEffect(() => {
        priorityQueue.push(tag);

        const handleKeyUp = (event: KeyboardEvent) => {
            if(priorityQueue.at(-1) !== tag) {
                return;
            }

            if(!keys?.length){
                return handler(event);
            }

            if (keys.includes(event.key)) {
                handler(event);
            }
        };

        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("keyup", handleKeyUp);
            priorityQueue = priorityQueue.filter(t => t !== tag);
        };
    }, [handler, keys]);
}