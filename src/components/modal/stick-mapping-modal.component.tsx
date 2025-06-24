import { useObservable } from "../../hooks/use-observable.hook";
import { useService } from "../../hooks/use-service.hook";
import { MappingsService } from "../../services/mappings.service";
import { ModalComponent, ModalExitCode, ModalService } from "../../services/modal.service";
import { Gamepad } from "../../ts/model/gamepad";
import { ModalTitle } from "./modal-title.component";
import { useCallback } from "react";
import { Action, AxisStickMapping, ConditionType, Mapping, StickType } from "../../ts/bindings/mapping";
import { StickActionModal } from "./stick-action-modal.component";
import { StickMouseMoveActionBuilder } from "../action-builders/stick-mouse-move-action-builder.component";
import { StickMouseScrollActionBuilder } from "../action-builders/stick-mouse-scroll-action-builder.component";

export const StickMappingModal: ModalComponent<void, {gamepad: Gamepad, stick: StickType}> = ({ resolver, options }) => {
    const { gamepad, stick } = options?.data || {};

    const modal = useService(ModalService);
    const mappingsService = useService(MappingsService);
    const mappings = useObservable(() => mappingsService.$stickMappings(stick));

    const addMapping = useCallback(async () => {
        if(!gamepad || !stick){
            return;
        }

        const res = await modal.openModal(StickActionModal, { data: gamepad });

        if(res.exitCode !== ModalExitCode.COMPLETED || !res.data){
            return;
        }

        const mapping: Mapping = { type: "axisStick", stick, id: crypto.randomUUID(), action: res.data.action, conditions: res.data.conditions };

        await mappingsService.addMapping(mapping);
    }, [gamepad, stick])

    const handleSaveMapping = useCallback((initialMapping: AxisStickMapping, res: {action: Action, conditions: ConditionType[]}) => {
        const mapping: AxisStickMapping = { ...initialMapping, action: res.action, conditions: res.conditions };
        mappingsService.updateMapping(mapping as Mapping);
    }, [])

    const handleDeleteMapping = useCallback((mapping: AxisStickMapping) => {
        mappingsService.removeMapping(mapping.id);
    }, [])

    const renderActionBuilder = useCallback((mapping: AxisStickMapping) => {
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
            case "mouseMoveStick":
                return <StickMouseMoveActionBuilder {...commonProps} action={mapping.action} />;
            case "scrollStick":
                return <StickMouseScrollActionBuilder {...commonProps} action={mapping.action} />;
            default:
                return null;
        }
    }, [gamepad, handleSaveMapping, handleDeleteMapping]);
    
    return (
        <div className="flex flex-col h-full">
            <ModalTitle title={stick} onBack={() => resolver({ exitCode: ModalExitCode.CLOSED })}/>
            <div className="grow overflow-y-scroll flex flex-col gap-2 pb-2 scrollbar-default">
                <button className="px-6 bg-neutral-800 text-sm text-white p-2 m-2 rounded-md font-bold shadow-black shadow-sm cursor-pointer hover:bg-black hover:text-teal-300" onClick={e => {e.preventDefault(); addMapping()}}>Add a mapping</button>
                <div className="flex flex-col gap-2 px-2">
                    {mappings?.map(mapping => renderActionBuilder(mapping))}
                </div>
            </div>
        </div>
    )
}
