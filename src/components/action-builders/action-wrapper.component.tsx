import { forwardRef } from "react";
import { cn } from "../../helpers/css.helpers";
import { Tooltip } from "react-tooltip";
import { DropdownButton } from "../dropdown-button.component";
import { ThreeDotsIcon } from "../icons/three-dots-icon.component";
import { UndoIcon } from "../icons/undo-icon.component";
import { AnimatePresence, motion } from "framer-motion";
import { ConditionBuilder } from "../condition-builder.component";
import { Gamepad } from "../../ts/model/gamepad";
import { ConditionType } from "../../ts/bindings/mapping";

type Props = {
    className?: string;
    title: string;
    gamepad: Gamepad;
    conditions: ConditionType[];
    children?: React.ReactNode;
    isEdit: boolean;
    hasChanged: boolean;
    onCancelEdit: () => void;
    onDelete: () => void;
    onSave: () => void;
    onConditionChange: (conditions: ConditionType[]) => void;
}

export const ActionWrapper = forwardRef<HTMLDivElement, Props>(({ className, title, gamepad, conditions, children, isEdit, hasChanged, onCancelEdit, onDelete, onSave, onConditionChange }, ref) => {
    return (
        <div ref={ref} className={cn(className)}>
            <div className="flex flex-row items-start justify-between">
                <h1 className="font-bold mb-1">{title}</h1>
                {isEdit && (() => {
                    if(hasChanged){
                        return (
                            <div className="flex flex-row gap-1 items-center">
                                <button className="size-6 bg-gray-300 rounded-md cursor-pointer p-0.5" onClick={onCancelEdit} data-tooltip-id="cancel-edit-tooltip"><UndoIcon/></button>
                                <Tooltip id="cancel-edit-tooltip" opacity={1} content="Annuler" place="top-start"/>
                            </div>
                        );
                    } else {
                        return (
                            <DropdownButton className="size-6 bg-gray-300 rounded-md cursor-pointer" classNames={{ menu: "right-0 origin-top-right translate-y-0.5", button: "transition-colors p-0.5 hover:bg-gray-400" }} items={[{ label: "Supprimer", value: "delete" }]} onChange={onDelete}>
                                <ThreeDotsIcon/>
                            </DropdownButton>
                        );
                    }
                })()}
            </div>
            {children}
            <div className="flex flex-row gap-1 max-w-full">
                <span className="flex items-center">Condition</span>
                <ConditionBuilder gamepad={gamepad} conditions={conditions} className="grow shrink-1 min-h-7" onChange={onConditionChange}/>
            </div>
            <AnimatePresence>
            {(() => {
                if(!isEdit){
                    return (
                        <button className="w-full h-8 mt-2 bg-neutral-800 text-sm text-white rounded-md font-bold shadow-black shadow-sm cursor-pointer hover:bg-black hover:text-teal-300" onClick={onSave}>Create mapping</button>
                    );
                } else if(isEdit && hasChanged) {
                    return (
                        <motion.button className="block w-full mt-2 bg-neutral-800 text-sm text-white rounded-md font-bold shadow-black shadow-sm cursor-pointer overflow-hidden hover:bg-black hover:text-teal-300" initial={{ height: 0 }} animate={{ height: 32 }} exit={{ height: 0 }} onClick={onSave}>Save</motion.button>    
                    )
                }
            })()}
            </AnimatePresence>
        </div>
    )
});
