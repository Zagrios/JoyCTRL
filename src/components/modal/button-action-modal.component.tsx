import { AnimatePresence } from "framer-motion";
import { ModalComponent, ModalExitCode } from "../../services/modal.service";
import { Action, ButtonMapping, ConditionType } from "../../ts/bindings/mapping";
import { ModalTitle } from "./modal-title.component";
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gamepad } from "../../ts/model/gamepad";
import { ButtonMouseMoveActionBuilder } from "../action-builders/button-mouse-move-action-builder.component";
import { ActionBuilder } from "../action-builders/types";
import { useOnClickOutside } from "../../hooks/use-on-click-outside.hook";
import { useOnKeyUp } from "../../hooks/use-on-key-up.hook";
import { ChevronForwardIcon } from "../icons/cheveron-forward-icon.component";
import { ButtonMouseClickActionBuilder } from "../action-builders/button-mouse-click-action-builder.component";
import { ButtonPressKeyActionBuilder } from "../action-builders/button-press-key-action-builder.component";
import { ButtonWriteTextActionBuilder } from "../action-builders/button-write-text-action-builder.component";
import { ButtonOpenWebsiteActionBuilder } from "../action-builders/button-open-website-action-builder.component";
import { ButtonOpenFileActionBuilder } from "../action-builders/button-open-file-action-builder.component";
import { ButtonMouseScrollActionBuilder } from "../action-builders/button-mouse-scroll-action-builder.component";
import { ButtonPauseResumeActionBuilder } from "../action-builders/button-pause-resume-action-builder.component";
import { ToogleVirtualKeyboardActionBuilder } from "../action-builders/toogle-virtual-keyboard-action-builder.component";

type ReturnMapping = Omit<ButtonMapping, "id" | "button">;

export const ButtonActionModal: ModalComponent<ReturnMapping, Gamepad> = ({ resolver, options: { data: gamepad } }) => {

    const modalRef = useRef<HTMLDivElement>(null);
    const [ActionBuilder, setActionBuilder] = useState<ActionBuilder<Action["type"]> | undefined>();

    useOnKeyUp("button-action-modal", () => {
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
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonMouseMoveActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Move cursor</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonMouseClickActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Click mouse</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonMouseScrollActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Scroll</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                        </div>  
                        <span className="block rounded-md font-bold mx-2 px-1.5">Clavier</span>
                        <div className="flex flex-col gap-1">
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonPressKeyActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Press keys</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonWriteTextActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Write text</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                        </div>
                        <span className="block rounded-md font-bold mx-2 px-1.5">Système</span>
                        <div className="flex flex-col gap-1">
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonOpenWebsiteActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Open Website</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonOpenFileActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Open file</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                        </div>
                        <span className="block rounded-md font-bold mx-2 px-1.5">JoyCTRL</span>
                        <div className="flex flex-col gap-1">
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ButtonPauseResumeActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Pause / Resume</h2>
                                <span className="float-right size-6"><ChevronForwardIcon className="size-full"/></span>
                            </div>
                            <div className="bg-gray-200 rounded-md p-2 mx-2 cursor-pointer hover:bg-gray-300 transition-colors" role="button" onClick={() => setActionBuilder(() => ToogleVirtualKeyboardActionBuilder as ActionBuilder<Action["type"]>)}>
                                <h2 className="inline">Toogle virtual keyboard</h2>
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