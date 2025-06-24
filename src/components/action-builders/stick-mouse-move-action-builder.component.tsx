import { useCallback, useMemo, useState } from "react";
import { ConditionType, MouseMoveMode } from "../../ts/bindings/mapping";
import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";
import { cn } from "../../helpers/css.helpers";
import { AnimatePresence, motion } from "framer-motion";

export function StickMouseMoveActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"mouseMoveStick">) {

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [mode, setMode] = useState<MouseMoveMode>(initialAction?.mode ?? "relative");
    const [speed, setSpeed] = useState<number>(initialAction?.speed ?? 10);
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(mode, initialAction?.mode) || !deepEqual(speed, initialAction?.speed) || !deepEqual(conditions, initialConditions);
    }, [mode, speed, conditions, initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "mouseMoveStick", mode, speed }, conditions });
    }, [mode, conditions, onSave, speed]);

    const handleCancelEdit = useCallback(() => {
        setMode(() => initialAction?.mode ?? "relative");
        setSpeed(() => initialAction?.speed ?? 10);
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, Math.min(100, Number(e.target.value))) || 10; // clamp the value between 1 and 100 and prevent NaN
        setSpeed(() => value);
    }, []);

    return (
        <ActionWrapper className={cn(className)} title="Move cursor" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <AnimatePresence>
                {mode === "relative" && (
                    <motion.div className="flex flex-row gap-2 items-center mb-1.5 overflow-hidden" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}>
                        <label htmlFor="speed">Speed</label>
                        <input className="grow bg-gray-300 rounded-md p-1" type="number" min={1} max={100} value={speed} step={1} onChange={handleSpeedChange} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-row gap-1 items-center mb-1.5">
                <label htmlFor="mode">Mode</label>
                <select className="grow bg-gray-300 rounded-md p-1" name="mode" id="mode" value={mode} onChange={e => setMode(e.target.value as MouseMoveMode)}>
                    <option value="relative">Relative</option>
                    <option value="absolute">Absolute (experimental)</option>
                </select>
            </div>
        </ActionWrapper>
    )
}