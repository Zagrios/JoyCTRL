import { useCallback, useMemo, useState } from "react";
import { ConditionType, Direction } from "../../ts/bindings/mapping";
import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";
import { cn } from "../../helpers/css.helpers";

export function ButtonMouseMoveActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"mouseMoveDirection">) {

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [direction, setDirection] = useState<Direction>(initialAction?.direction ?? "up");
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(direction, initialAction?.direction) || !deepEqual(conditions, initialConditions);
    }, [direction, conditions, initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "mouseMoveDirection", direction }, conditions });
    }, [direction, conditions, onSave]);

    const handleCancelEdit = useCallback(() => {
        setDirection(() => initialAction?.direction ?? "up");
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    return (
        <ActionWrapper className={cn(className)} title="Mouse move" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-1 items-center mb-1.5">
                <label htmlFor="direction">Direction</label>
                <select className="grow bg-gray-300 rounded-md p-1" name="direction" id="direction" value={direction} onChange={e => setDirection(e.target.value as Direction)}>
                    <option value="up">↑ Up</option>
                    <option value="down">↓ Down</option>
                    <option value="left">← Left</option>
                    <option value="right">→ Right</option>
                </select>
            </div>
        </ActionWrapper>
    )
}