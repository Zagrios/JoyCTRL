import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { useCallback, useMemo, useState } from "react";
import { ConditionType } from "../../ts/bindings/mapping";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";

export function ButtonPauseResumeActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"toogleMappingActive">) {

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(conditions, initialConditions);
    }, [conditions, initialConditions]);

    const handleCancelEdit = useCallback(() => {
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "toogleMappingActive" }, conditions });
    }, [conditions, onSave]);


    return (
        <ActionWrapper className={className} title="Pause / Resume" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}/>
    )
}

