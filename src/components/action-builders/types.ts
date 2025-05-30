import { JSX } from "react";
import { Action, ConditionType } from "../../ts/bindings/mapping";
import { Gamepad } from "../../ts/model/gamepad";

export type ActionBuilderProps<T extends Action["type"]> = {
    className?: string;
    gamepad: Gamepad;
    action?: Action & {type: T},
    conditions?: ConditionType[],
    onSave?: (res: {action: Action & {type: T}, conditions: ConditionType[]}) => void,
    onDelete?: () => void
}
export type ActionBuilder<T extends Action["type"]> = (props: ActionBuilderProps<T>) => JSX.Element;