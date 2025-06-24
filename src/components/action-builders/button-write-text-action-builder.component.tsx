import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConditionType } from "../../ts/bindings/mapping";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";
import { useService } from "../../hooks/use-service.hook";
import { IpcService } from "../../services/ipc.service";
import { FunctionKey, Layout } from "../keyboard/layouts";
import { useOnClickOutside } from "../../hooks/use-on-click-outside.hook";

type Props = ActionBuilderProps<"writeText"> & {
    listenToVkInitially?: boolean;
}

export function ButtonWriteTextActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, listenToVkInitially, onSave, onDelete }: Props) {

    const ipc = useService(IpcService);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);
    
    const [listenToVk, setListenToVk] = useState<boolean>(() => listenToVkInitially ?? true);
    const [text, setText] = useState<string>(initialAction?.text ?? "");
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    useOnClickOutside(() => {
        console.log("clicked outside");
        setListenToVk(() => false);
    }, [inputRef]);

    useEffect(() => {
        console.log("listenToVk", listenToVk);
        const sub = listenToVk ? ipc.send("on-vk-key-pressed", undefined).subscribe(key => {

            if(key === FunctionKey.Backspace) {
                setText(prev => prev.slice(0, -1));
                return;
            }

            if(key.length > 1) {
                return;
            }

            const currentLayout = (localStorage.getItem("vk-current-layout") as keyof Layout["layout"]) ?? "default";

            setText(prev => prev + (currentLayout === "shift" ? key.toUpperCase() : key));
        }) : null;

        return () => sub?.unsubscribe();
    }, [listenToVk])

    const hasChanged = useMemo(() => {
        return !deepEqual(text, initialAction?.text) || !deepEqual(conditions, initialConditions);
    }, [text, conditions, initialAction, initialConditions]);

    const handleCancelEdit = useCallback(() => {
        setText(() => initialAction?.text ?? "");
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "writeText", text }, conditions });
    }, [text, conditions, onSave]);


    return (
        <ActionWrapper className={className} title="Write text" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-1 items-center mb-1.5">
                <label htmlFor="keys">Text</label>
                <textarea ref={inputRef} onClick={() => setListenToVk(() => true)} className="flex-1 bg-gray-300 p-1 min-h-8 h-8 max-h-20 w-full rounded-md" value={text} onChange={e => setText(e.target.value)} placeholder="Write text here..."/>
            </div>
        </ActionWrapper>
    )
}

