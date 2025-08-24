import { useObservable } from "../../hooks/use-observable.hook";
import { useService } from "../../hooks/use-service.hook";
import { MappingsService } from "../../services/mappings.service";
import { ModalComponent, ModalExitCode, ModalService } from "../../services/modal.service";
import { GamepadButton } from "../../ts/bindings/gamepad";
import { Gamepad } from "../../ts/model/gamepad";
import { ModalTitle } from "./modal-title.component";
import { useCallback } from "react";
import { ButtonActionModal } from "./button-action-modal.component";
import { Action, ButtonMapping, ConditionType, Mapping } from "../../ts/bindings/mapping";
import { ButtonMouseMoveActionBuilder } from "../action-builders/button-mouse-move-action-builder.component";
import { ButtonMouseClickActionBuilder } from "../action-builders/button-mouse-click-action-builder.component";
import { ButtonPressKeyActionBuilder } from "../action-builders/button-press-key-action-builder.component";
import { ButtonWriteTextActionBuilder } from "../action-builders/button-write-text-action-builder.component";
import { ButtonOpenWebsiteActionBuilder } from "../action-builders/button-open-website-action-builder.component";
import { ButtonOpenFileActionBuilder } from "../action-builders/button-open-file-action-builder.component";
import { ButtonPauseResumeActionBuilder } from "../action-builders/button-pause-resume-action-builder.component";
import { ButtonMouseScrollActionBuilder } from "../action-builders/button-mouse-scroll-action-builder.component";
import { ToogleVirtualKeyboardActionBuilder } from "../action-builders/toogle-virtual-keyboard-action-builder.component";

export const ButtonMappingModal: ModalComponent<void, {gamepad: Gamepad, button: GamepadButton}> = ({ resolver, options }) => {
    const { gamepad, button } = options?.data || {};

    const modal = useService(ModalService);
    const mappingsService = useService(MappingsService);
    const mappings = useObservable(() => mappingsService.$buttonMappings(button!));

    const addMapping = useCallback(async () => {
        if(!gamepad || !button){
            return;
        }

        const res = await modal.openModal(ButtonActionModal, { data: gamepad });

        if(res.exitCode !== ModalExitCode.COMPLETED || !res.data){
            return;
        }

        const mapping: Mapping = { type: "buttonPressed", button, id: crypto.randomUUID(), action: res.data.action, conditions: res.data.conditions };

        await mappingsService.addMapping(mapping);
    }, [gamepad, button])

    const handleSaveMapping = useCallback((initialMapping: ButtonMapping, res: {action: Action, conditions: ConditionType[]}) => {
        const mapping: ButtonMapping = { ...initialMapping, action: res.action, conditions: res.conditions };
        mappingsService.updateMapping(mapping as Mapping).catch(err => {
            console.error(err);
        });
    }, [])

    const handleDeleteMapping = useCallback((mapping: ButtonMapping) => {
        mappingsService.removeMapping(mapping.id);
    }, [])

    const renderActionBuilder = useCallback((mapping: ButtonMapping) => {
        const commonProps = {
            className: "bg-gray-200 rounded-md p-2",
            key: mapping.id,
            gamepad: gamepad!,
            action: mapping.action,
            conditions: mapping.conditions,
            onSave: (update: {action: Action, conditions: ConditionType[]}) => handleSaveMapping(mapping, update),
            onDelete: () => handleDeleteMapping(mapping)
        };

        switch(mapping.action.type) {
            case "mouseMoveDirection":
                return <ButtonMouseMoveActionBuilder {...commonProps} action={mapping.action} />;
            case "mouseClick":
                return <ButtonMouseClickActionBuilder {...commonProps} action={mapping.action} />;
            case "scrollDirection":
                return <ButtonMouseScrollActionBuilder {...commonProps} action={mapping.action} />;
            case "pressKeys":
                return <ButtonPressKeyActionBuilder {...commonProps} action={mapping.action} />;
            case "writeText":
                return <ButtonWriteTextActionBuilder {...commonProps} action={mapping.action} listenToVkInitially={false}/>;
            case "openWebsite":
                return <ButtonOpenWebsiteActionBuilder {...commonProps} action={mapping.action} />;
            case "openFile":
                return <ButtonOpenFileActionBuilder {...commonProps} action={mapping.action} />;
            case "toogleMappingActive":
                return <ButtonPauseResumeActionBuilder {...commonProps} action={mapping.action} />;
            case "toogleVirtualKeyboard":
                return <ToogleVirtualKeyboardActionBuilder {...commonProps} action={mapping.action} />;
            default:
                return null;
        }
    }, [gamepad, handleSaveMapping, handleDeleteMapping]);
    
    return (
        <div className="flex flex-col h-full">
            <ModalTitle title={`Button ${gamepad?.brand()}_${button}`} onBack={() => resolver({ exitCode: ModalExitCode.CLOSED })}/>
            <div className="grow overflow-y-scroll flex flex-col gap-2 pb-2 scrollbar-default">
                <button className="px-6 bg-neutral-800 text-sm text-white p-2 m-2 rounded-md font-bold shadow-black shadow-sm cursor-pointer hover:bg-black hover:text-teal-300" onClick={e => {e.preventDefault(); addMapping()}}>Add a mapping</button>
                <div className="flex flex-col gap-2 px-2">
                    {mappings?.map(mapping => renderActionBuilder(mapping))}
                </div>
            </div>
        </div>
    )
}
