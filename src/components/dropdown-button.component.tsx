import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../helpers/css.helpers";
import { useOnClickOutside } from "../hooks/use-on-click-outside.hook";
import { AnimatePresence, motion } from "framer-motion";

type Props<T = string> = {
    className?: string;
    classNames?: {
        button?: string;
        menu?: string;
    };
    children: React.ReactNode;
    items: { label: string; value: T }[];
    onOpenChange?: (open: boolean) => void;
    onChange?: (value: T) => void;
}

export function DropdownButton<T = string>({ className, classNames, children, items, onOpenChange, onChange }: Props<T>) {

    const ref = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    useOnClickOutside(() => setOpen(false), [ref, dropdownRef]);

    useEffect(() => {
        onOpenChange?.(open);
    }, [open, onOpenChange]);

    const handleClickItem = useCallback((value: T) => {
        setOpen(false);
        onChange?.(value);
    }, [onChange]);

    return (
        <div className="relative">
            <button ref={ref} className={cn(className, classNames?.button)} onClick={() => setOpen(prev => !prev)}>{children}</button>
            <AnimatePresence>
                {open && (
                    <motion.div ref={dropdownRef} className={cn("absolute top-full bg-gray-200 rounded-md origin-top overflow-y-auto overflow-x-hidden scrollbar-default scroll-smooth shadow-black/40 shadow-[0_3px_10px_rgb(0,0,0,0.2)] z-10 pointer-events-auto", classNames?.menu)} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        {items.map(item => (
                            <button key={item.value as string} className="w-full p-1 cursor-pointer text-nowrap hover:bg-gray-400/50" onClick={() => handleClickItem(item.value)}>{item.label}</button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
    )
}
