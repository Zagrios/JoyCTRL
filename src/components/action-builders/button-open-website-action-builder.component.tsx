import { ActionBuilderProps } from "./types";
import { useConstant } from "../../hooks/use-constant.hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConditionType } from "../../ts/bindings/mapping";
import { deepEqual } from "fast-equals";
import { ActionWrapper } from "./action-wrapper.component";
import { tryit } from "../../helpers/error.helpers";
import { Tooltip } from "react-tooltip";

export function ButtonOpenWebsiteActionBuilder({ className, gamepad, action: initialAction, conditions: initialConditions, onSave, onDelete }: ActionBuilderProps<"openWebsite">) {

    const isEdit = useConstant<boolean>(() => !!initialAction || !!initialConditions?.length);

    const [url, setUrl] = useState<string>(initialAction?.url ?? "");
    const [isUrlValid, setIsUrlValid] = useState<boolean>(true);
    const [conditions, setConditions] = useState<ConditionType[]>(initialConditions ?? []);

    useEffect(() => {
        if(!url) {
            setIsUrlValid(() => true);
            return;
        }
        
        const res = tryit(() => new URL(url));
        setIsUrlValid(() => res.error === null);
    }, [url]);

    const hasChanged = useMemo(() => {
        return !deepEqual(url, initialAction?.url) || !deepEqual(conditions, initialConditions);
    }, [url, conditions, initialAction, initialConditions]);

    const handleCancelEdit = useCallback(() => {
        setUrl(() => initialAction?.url ?? "");
        setConditions(() => initialConditions ?? []);
    }, [initialAction, initialConditions]);

    const saveMapping = useCallback(() => {
        onSave?.({ action: { type: "openWebsite", url }, conditions });
    }, [url, conditions, onSave]);

    return (
        <ActionWrapper className={className} title="Open website" gamepad={gamepad} conditions={conditions} isEdit={isEdit} hasChanged={hasChanged} onCancelEdit={handleCancelEdit} onDelete={() => onDelete?.()} onSave={saveMapping} onConditionChange={setConditions}>
            <div className="flex flex-row gap-1 items-center mb-1.5"> 
                <label htmlFor="url">Url</label>
                <input className={`flex-1 bg-gray-300 p-1 min-h-8 h-8 max-h-20 w-full rounded-md ${isUrlValid ? "" : "outline-2 outline-red-500"}`} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.example.com" data-tooltip-id="url-tooltip"/>
            </div>
            {!isUrlValid && <Tooltip id="url-tooltip" content="URL is invalid" opacity={1}/>}
        </ActionWrapper>
    )
}

