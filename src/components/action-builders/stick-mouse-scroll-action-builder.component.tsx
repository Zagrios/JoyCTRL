import { useCallback, useMemo, useState } from 'react';
import { ConditionType } from '../../ts/bindings/mapping';
import { ActionWrapper } from './action-wrapper.component'
import { ActionBuilderProps } from './types'
import { useConstant } from '../../hooks/use-constant.hook';
import { deepEqual } from 'fast-equals';

export function StickMouseScrollActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"scrollStick">) {
    
    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [speed, setSpeed] = useState<number>(initialAction?.speed ?? 10);
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(speed, initialAction?.speed) || !deepEqual(conditions, initialConditions);
    }, [speed, conditions, initialAction, initialConditions]);
    
    const handleCancelEdit = useCallback(() => {
        setSpeed(() => initialAction?.speed ?? 10);
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "scrollStick", speed }, conditions });
    }, [conditions, onSave, speed]);

    const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, Math.min(100, Number(e.target.value))) || 10; // clamp the value between 1 and 100 and prevent NaN
        setSpeed(() => value);
    }, []);

    return (
        <ActionWrapper className={className} title="Scroll" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-2 items-center mb-1.5 overflow-hidden">
                <label htmlFor="speed">Speed</label>
                <input className="grow bg-gray-300 rounded-md p-1" type="number" min={1} max={100} value={speed} step={1} onChange={handleSpeedChange} />
            </div>
        </ActionWrapper>
    )
}
