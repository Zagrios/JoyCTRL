import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { useCallback, useMemo, useState } from "react";
import { ConditionType } from "../../ts/bindings/mapping";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";

export function ToogleVirtualKeyboardActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"toogleVirtualKeyboard">) {

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(conditions, initialConditions);
    }, [conditions, initialConditions]);

    const handleCancelEdit = useCallback(() => {
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "toogleVirtualKeyboard" }, conditions });
    }, [conditions, onSave]);


    return (
        <ActionWrapper className={className} title="Virtual keyboard" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}/>
    )
}

