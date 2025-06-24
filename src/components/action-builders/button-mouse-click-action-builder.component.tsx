import { useCallback, useMemo, useState } from 'react';
import { ConditionType, MouseButton } from '../../ts/bindings/mapping';
import { ActionWrapper } from './action-wrapper.component'
import { ActionBuilderProps } from './types'
import { useConstant } from '../../hooks/use-constant.hook';
import { deepEqual } from 'fast-equals';

export function ButtonMouseClickActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"mouseClick">) {
    
    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [mouseButton, setMouseButton] = useState<MouseButton>(initialAction?.button ?? "left");
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(mouseButton, initialAction?.button) || !deepEqual(conditions, initialConditions);
    }, [mouseButton, conditions, initialConditions, initialAction]);
    
    const handleCancelEdit = useCallback(() => {
        setMouseButton(() => initialAction?.button ?? "left");
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "mouseClick", button: mouseButton }, conditions });
    }, [mouseButton, conditions, onSave]);

    return (
        <ActionWrapper className={className} title="Mouse click" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-1 items-center mb-1.5">
                <label htmlFor="mouse-button">Button</label>
                <select className="grow bg-gray-300 rounded-md p-1" name="mouse-button" id="mouse-button" value={mouseButton} onChange={e => setMouseButton(e.target.value as MouseButton)}>
                    <option value="left">Left</option>
                    <option value="middle">Middle</option>
                    <option value="right">Right</option>
                </select>
            </div>
        </ActionWrapper>
    )
}
