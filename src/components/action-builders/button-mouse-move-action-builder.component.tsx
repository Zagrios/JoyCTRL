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
    const [speed, setSpeed] = useState<number>(initialAction?.speed ?? 10);
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(direction, initialAction?.direction) || !deepEqual(conditions, initialConditions) || !deepEqual(speed, initialAction?.speed);
    }, [direction, speed, conditions, initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "mouseMoveDirection", direction, speed }, conditions });
    }, [direction, conditions, onSave, speed]);

    const handleCancelEdit = useCallback(() => {
        setDirection(() => initialAction?.direction ?? "up");
        setSpeed(() => initialAction?.speed ?? 10);
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, Math.min(100, Number(e.target.value))) || 10; // clamp the value between 1 and 100 and prevent NaN
        console.log(value);
        setSpeed(() => value);
    }, []);

    return (
        <ActionWrapper className={cn(className)} title="Move cursor" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-2 items-center mb-1.5 overflow-hidden">
                <label htmlFor="speed">Speed</label>
                <input className="grow bg-gray-300 rounded-md p-1" type="number" min={1} max={100} value={speed} step={1} onChange={handleSpeedChange} />
            </div>
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