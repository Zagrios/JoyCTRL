import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { useCallback, useMemo, useState } from "react";
import { ConditionType } from "../../ts/bindings/mapping";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";
import { useService } from "../../hooks/use-service.hook";
import { IpcService } from "../../services/ipc.service";
import { lastValueFrom } from "rxjs";
import { tryit } from "../../helpers/error.helpers";

export function ButtonOpenFileActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"openFile">) {

    const ipc = useService(IpcService);

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [path, setPath] = useState<string>(initialAction?.path ?? "");
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    const hasChanged = useMemo(() => {
        return !deepEqual(conditions, initialConditions) || !deepEqual(path, initialAction?.path);
    }, [conditions, initialConditions, path, initialAction]);

    const handleCancelEdit = useCallback(() => {
        setPath(() => initialAction?.path ?? "");
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "openFile", path }, conditions });
    }, [path, conditions, onSave]);

    const handleOpenFile = useCallback(async () => {
        const res = await tryit(async () => lastValueFrom(ipc.send("open-file")));

        if(res.result){
            setPath(() => res.result!);
        }
    }, []);

    return (
        <ActionWrapper className={className} title="Open file" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-1 items-center mb-1.5"> 
                <label htmlFor="path">File</label>
                <button className={`flex-1 bg-gray-300 p-1 min-h-8 h-8 max-h-20 w-full rounded-md cursor-pointer text-left overflow-hidden text-ellipsis ${path ? "" : "text-gray-500"}`} title={path} role="button" value={path} onClick={handleOpenFile}>{path || "Click to choose a file"}</button>
            </div>
        </ActionWrapper>
    )
}