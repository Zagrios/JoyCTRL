import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BooleanOperator, ConditionType } from "../ts/bindings/mapping"
import { cn } from "../helpers/css.helpers";
import { Tooltip } from "react-tooltip";
import { GamepadButton } from "../ts/bindings/gamepad";
import { Gamepad } from "../ts/model/gamepad";
import { ChevronDownIcon } from "./icons/chevron-down-icon.component";
import { useConstant } from "../hooks/use-constant.hook";
import { DropdownButton } from "./dropdown-button.component";
import { ThreeDotsIcon } from "./icons/three-dots-icon.component";

type Props = {
    gamepad: Gamepad;
    className?: string;
    conditions?: ConditionType[];
    onChange?: (conditions: ConditionType[]) => void;
}

export function ConditionBuilder({ className, gamepad, conditions: initialConditions, onChange }: Props) {

    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);
    const [conditionChoiceOpen, setConditionChoiceOpen] = useState(false);

    useEffect(() => {
        setConditions(() => initialConditions ?? []);
    }, [initialConditions]);

    useEffect(() => {
        onChange?.(conditions);
    }, [conditions, onChange]);

    const addCondiction = useCallback((condition: Omit<ConditionType, "operator">) => {
        const newCondition: ConditionType = { operator: "and", ...condition };
        setConditions(prev => [...prev, newCondition]);
    }, [])

    const updateCondition = useCallback((index: number, condition: ConditionType) => {
        setConditions(prev => {
            const newConditions = [...prev];
            newConditions[index] = condition;
            return newConditions;
        })
    }, []);

    const handleAddCondition = useCallback((conditionType: "buttonPressed") => {
        if(conditionType === "buttonPressed") {
            addCondiction({ type: "buttonPressed", button: "a" });
        }
    }, [addCondiction]);

    return (
        <div className={cn("flex flex-row flex-wrap gap-1 bg-gray-300 rounded-md p-1 relative min-h-8", className)}>
            <Tooltip id="add-condition-tooltip" opacity={1} content="Ajouter une condition"/>
            <DropdownButton 
                onOpenChange={open => setConditionChoiceOpen(() => open)}
                className="size-7 bg-gray-400/50 rounded-md font-bold cursor-pointer select-none hover:bg-gray-400/75 transition-colors"
                classNames={{ menu: "origin-top-left translate-y-0.5 text-sm" }}
                items={[{ label: "If button pressed", value: "buttonPressed" }]} onChange={handleAddCondition}>
                <span>{conditionChoiceOpen ? "-" : "+"}</span>
            </DropdownButton>
            {(() => {
                if(!conditions?.length) {
                    return <div className="text-sm text-gray-700 flex items-center justify-center h-7">Always active</div>
                }
                return conditions.map((condition, index) => {
                    switch(condition.type) {
                        case "buttonPressed":
                        case "buttonNotPressed":
                            return <ButtonPressedCondition gamepad={gamepad} condition={condition} first={index === 0} onChange={condition => updateCondition(index, condition)} onDelete={() => setConditions(prev => prev.filter((_, i) => i !== index))}/>
                    }
                });
            })()}
        </div>
    )
}

type ConditionBuilderWrapperProps = {
    first?: boolean;
    operator: BooleanOperator;
    children: React.ReactNode;
    onChange?: (operator: BooleanOperator) => void;
    onDelete?: () => void;
}

function ConditionBuilderWrapper({ first, operator, children, onChange, onDelete }: ConditionBuilderWrapperProps) {

    const items = useConstant<{ label: string, value: BooleanOperator }[]>([{ label: "ET", value: "and" }, { label: "OU", value: "or" }]);

    const handleDropdownChange = useCallback((value: "delete") => {
        if(value === "delete") {
            onDelete?.();
        }
    }, [onDelete]);

    return (
        <>
            {!first && (
                <ConditionSelect className="h-7 w-fit bg-gray-400/50 rounded-md text-xs px-1 font-bold hover:bg-gray-400" items={items} value={operator} onChange={onChange}/>
            )}
            <div className="h-7 flex flex-row items-center bg-gray-400/50 text-xs rounded-md">
                {children}
                <DropdownButton className="h-7 w-3 flex items-center justify-center rounded-r-md hover:bg-gray-400" classNames={{ menu: "origin-top left-1/2 -translate-x-1/2 translate-y-0.5 text-md" }} items={[{ label: "Supprimer", value: "delete" }]} onChange={handleDropdownChange}>
                    <ThreeDotsIcon className="absolute w-4"/>
                </DropdownButton>
            </div> 
        </>
    )
}

type ButtonPressedConditionProps = {
    gamepad: Gamepad;
    condition: ConditionType & { type: "buttonPressed" | "buttonNotPressed" }
    first?: boolean;
    onChange?: (condition: ConditionType & { type: "buttonPressed" | "buttonNotPressed" }) => void;
    onDelete?: () => void;
}

function ButtonPressedCondition({ gamepad, condition, first, onChange, onDelete }: ButtonPressedConditionProps) {

    const availableButtons: { label: string, value: GamepadButton }[] = useMemo(() => {
        const mask = gamepad.getButtonMask();
        return Object.keys(gamepad.buttons()).filter(btn => !mask.includes(btn as GamepadButton)).sort((a, b) => a.length - b.length).map(btn => ({ label: btn, value: btn as GamepadButton }));
    }, [gamepad]);

    const changeOperator = useCallback((operator: BooleanOperator) => {
        onChange?.({ ...condition, operator });
    }, [condition, onChange]);

    const changeButton = useCallback((button: GamepadButton) => {
        onChange?.({ ...condition, button });
    }, [condition, onChange]);

    const handleReverse = useCallback(() => {
        if(condition.type === "buttonPressed") {
            onChange?.({ ...condition, type: "buttonNotPressed" });
        } else {
            onChange?.({ ...condition, type: "buttonPressed" });
        }
    }, [condition, onChange]);

    return (
        <ConditionBuilderWrapper operator={condition.operator} onChange={changeOperator} onDelete={onDelete} first={first}>
            <ConditionSelect className="h-full pl-1.5 rounded-l-md hover:bg-gray-400 font-bold" items={availableButtons} value={condition.button} onChange={changeButton}/>
            <button className="flex items-center text-nowrap pl-0.5 pr-1 cursor-alias h-full hover:bg-gray-400" onClick={handleReverse}>{condition.type === "buttonPressed" ? "Is pressed" : "Is not pressed"}</button>
        </ConditionBuilderWrapper>
    )
}

type ConditionSelectProps<T = string> = {
    className?: string;
    items: {
        label: string;
        value: T;
    }[];
    value: T;
    onChange?: (value: T) => void;
}

function ConditionSelect<T = string>({ className, items, value, onChange }: ConditionSelectProps<T>) {

    const selectRef = useRef<HTMLSelectElement>(null);

    const selectValue = useMemo(() => {
        return items.findIndex(item => item.value === value);
    }, [items, value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange?.(items[Number(e.target.value)]?.value);
        selectRef.current?.blur();
    }, [onChange, items]);

    return (
        <div className={cn("relative appearance-none text-xs font-bold overflow-hidden min-w-0 hover:bg-gray-400 flex items-center justify-center", className)}>
            <select ref={selectRef} className="h-full absolute bg-transparent text-transparent outline-none cursor-pointer" value={selectValue} onChange={handleChange}>
            {items.map((item, index) => (
                <option className="text-black bg-gray-200" key={JSON.stringify(item.value)} value={index}>{item.label}</option>
            ))}
            </select>
            <p>{items[selectValue]?.label}</p>
            <span className="size-4 flex items-center justify-center"><ChevronDownIcon/></span>
        </div>
    );
        
}
