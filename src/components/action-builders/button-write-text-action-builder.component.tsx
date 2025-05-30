import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { useCallback, useMemo, useState } from "react";
import { ConditionType } from "../../ts/bindings/mapping";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";

export function ButtonWriteTextActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"writeText">) {

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [text, setText] = useState<string>(initialAction?.text ?? "");
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(conditions, initialConditions) || !deepEqual(text, initialAction?.text);
    }, [conditions, initialConditions, text, initialAction]);

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
                <textarea className="flex-1 bg-gray-300 p-1 min-h-8 h-8 max-h-20 w-full rounded-md" value={text} onChange={e => setText(e.target.value)} placeholder="Write text here..."/>
            </div>
        </ActionWrapper>
    )
}

