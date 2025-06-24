import { useCallback, useMemo, useState } from 'react';
import { ConditionType, Direction } from '../../ts/bindings/mapping';
import { ActionWrapper } from './action-wrapper.component'
import { ActionBuilderProps } from './types'
import { useConstant } from '../../hooks/use-constant.hook';
import { deepEqual } from 'fast-equals';

export function ButtonMouseScrollActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"scrollDirection">) {
    
    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [direction, setDirection] = useState<Direction>(initialAction?.direction ?? "left");
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(conditions, initialConditions);
    }, [conditions, initialConditions]);
    
    const handleCancelEdit = useCallback(() => {
        setDirection(() => initialAction?.direction ?? "left");
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "scrollDirection", direction: direction }, conditions });
    }, [direction, conditions, onSave]);

    return (
        <ActionWrapper className={className} title="Mouse scroll" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-1 items-center mb-1.5">
                <label htmlFor="direction">Direction</label>
                <select className="grow bg-gray-300 rounded-md p-1" name="direction" id="direction" value={direction} onChange={e => setDirection(e.target.value as Direction)}>
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </select>
            </div>
        </ActionWrapper>
    )
}
