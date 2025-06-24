import { AnimatePresence } from "framer-motion";
import { ModalComponent, ModalExitCode } from "../../services/modal.service";
import { Action, AxisStickMapping, ConditionType } from "../../ts/bindings/mapping";
import { ModalTitle } from "./modal-title.component";
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gamepad } from "../../ts/model/gamepad";
import { ActionBuilder } from "../action-builders/types";
import { useOnClickOutside } from "../../hooks/use-on-click-outside.hook";
import { useOnKeyUp } from "../../hooks/use-on-key-up.hook";
import { ChevronForwardIcon } from "../icons/cheveron-forward-icon.component";
import { StickMouseMoveActionBuilder } from "../action-builders/stick-mouse-move-action-builder.component";
import { StickMouseScrollActionBuilder } from "../action-builders/stick-mouse-scroll-action-builder.component";

type ReturnMapping = Omit<AxisStickMapping, "id" | "stick">;

export const StickActionModal: ModalComponent<ReturnMapping, Gamepad> = ({ resolver, options: { data: gamepad } }) => {

    const modalRef = useRef<HTMLDivElement>(null);
    const [ActionBuilder, setActionBuilder] = useState<ActionBuilder<Action["type"]> | undefined>();

    useOnKeyUp("stick-action-modal", () => {
        if (ActionBuilder) {
            return setActionBuilder(() => undefined);
        }
        resolver({ exitCode: ModalExitCode.CLOSED });
    }, ["Escape"]);  

    useOnClickOutside(() => {
        setActionBuilder(() => undefined);
    }, modalRef);

    const handleSaveAction = useCallback((res: {action: Action, conditions: ConditionType[]}) => {
        resolver({ exitCode: ModalExitCode.COMPLETED, data: res });
        setActionBuilder(() => undefined);
    }, [resolver]);

    return (
        <div className="flex flex-col h-full">
            <ModalTitle title="Actions" onBack={() => resolver({ exitCode: ModalExitCode.CLOSED })} />
            <div className="relative size-full overflow-y-scroll scrollbar-default">
                <div className="grow flex flex-col gap-2 pb-2 relative">
                    <span className="block rounded-md font-bold mx-2 mt-2 px-1.5">Mouse</span>
                        <div className="flex flex-col gap-1">
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => StickMouseMoveActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Move cursor</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => StickMouseScrollActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Scroll</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                        </div>
                </div>
            </div>

            <AnimatePresence>
                {ActionBuilder && (
                    <>
                        <motion.span className="absolute top-0 left-0 block size-full bg-black" initial={{ opacity: 0 }} animate={{ opacity: .5 }} exit={{ opacity: 0 }}/>
                        <motion.div className="absolute size-full flex items-center justify-center top-0 left-0" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}>
                            <div className="contents" ref={modalRef}>
                                {ActionBuilder && <ActionBuilder className="w-full mx-4 h-fit bg-gray-200 rounded-md p-2 shadow-xl shadow-black/50" gamepad={gamepad} onSave={handleSaveAction} />}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            
        </div>
    )
}