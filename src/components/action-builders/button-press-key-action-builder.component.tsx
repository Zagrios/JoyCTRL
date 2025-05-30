import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConditionType } from "../../ts/bindings/mapping";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";
import { useOnKeyUp } from "../../hooks/use-on-key-up.hook";
import { Tooltip } from "react-tooltip";
import { PlayFillIcon } from "../icons/play-fill-icon.component";
import { StopFillIcon } from "../icons/stop-fill-icon.component";

export function ButtonPressKeyActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"pressKeys">) {

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [keys, setKeys] = useState<string[]>(initialAction?.keys ?? []);
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);
    const [isRecording, setIsRecording] = useState(false);

    const recordListener = useConstant(() => (e: KeyboardEvent) => {
        console.log(e.code);

        e?.preventDefault();
        const key = e?.key;

        if(!key) {
            return;
        }   

        setKeys(prev => [...prev, key]);
    });

    useEffect(() => {
        if(isRecording) {
            document.addEventListener("keydown", recordListener);

        } else {
            document.removeEventListener("keydown", recordListener);
        }

        return () => {
            document.removeEventListener("keydown", recordListener);
        }
    }, [isRecording]);

    // Capture the escape key to avoid closing the modal
    useOnKeyUp("ButtonPressKeyActionBuilder", e => e?.preventDefault(), ["Escape"]);

    const hasChanged = useMemo(() => {
        return !deepEqual(conditions, initialConditions) || !deepEqual(keys, initialAction?.keys);
    }, [conditions, initialConditions, keys, initialAction]);

    const handleCancelEdit = useCallback(() => {
        setKeys(() => initialAction?.keys ?? []);
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "pressKeys", keys }, conditions });
    }, [keys, conditions, onSave]);

    const handleKeyClick = useCallback((i: number) => {
        setKeys(prev => {
            const newKeys = [...prev];
            newKeys.splice(i, 1);
            return newKeys;
        });
    }, []);

    const toogleRecord = useCallback(() => {
        setIsRecording(prev => !prev);
    }, []);

    return (
        <ActionWrapper className={className} title="Press keys" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <p className="text-sm text-gray-600 mb-1.5">Start the record and use your keyboard to record keys.</p>
            <div className="flex flex-row gap-1 items-center mb-1.5">
                <label htmlFor="keys">Keys</label>
                <div className="bg-gray-300 p-1 min-h-8 w-full rounded-md flex flex-row flex-wrap gap-0.5 items-center max-h-20 overflow-y-scroll scrollbar-default" data-tooltip-id="keys-tooltip">
                    {keys.map((key, index) => (
                        <>
                            <KeyItem key={index} keyStr={key} onClick={() => handleKeyClick(index)} />
                            {index < keys.length - 1 && <span key={`${index}-separator`} className="text-gray-500">+</span>}
                        </>
                    ))}
                </div>
                <button className="bg-neutral-800 text-white rounded-md py-0.5 px-1 text-sm size-8 aspect-square cursor-pointer hover:text-teal-300" onClick={toogleRecord}>{isRecording ? <StopFillIcon/> : <PlayFillIcon/>}</button>
            </div>
        </ActionWrapper>
    )
}


function KeyItem({ keyStr, onClick }: { keyStr: string, onClick?: () => void }) {
  return (
    <>
        <kbd className="bg-gray-400/50 rounded-md py-0.5 px-1 cursor-no-drop text-sm" data-tooltip-id="delete-key-tooltip" onClick={onClick}>
            {keyStr}
        </kbd>
        <Tooltip id="delete-key-tooltip" className="!text-sm !p-1" content="Delete key" opacity={1}/>
    </>
  )
}

