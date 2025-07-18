// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { GamepadAxis, GamepadButton } from "./gamepad";

export type Action = { "type": "pressKeys", keys: Array<string>, } | { "type": "writeText", text: string, } | { "type": "mouseMoveDirection", direction: Direction, speed: number, } | { "type": "mouseClick", button: MouseButton, } | { "type": "mouseMoveStick", mode: MouseMoveMode, speed: number, } | { "type": "scrollDirection", direction: Direction, speed: number, } | { "type": "scrollStick", speed: number, } | { "type": "toogleMappingActive" } | { "type": "openWebsite", url: string, } | { "type": "openFile", path: string, };

export type AxisStickMapping = { id: string, stick: StickType, action: Action, conditions: Array<ConditionType>, };

export type AxisTriggerMapping = { id: string, axis: GamepadAxis, threshold: number, conditions: Array<ConditionType>, action: Action, };

export type BooleanOperator = "and" | "or";

export type ButtonMapping = { id: string, button: GamepadButton, action: Action, conditions: Array<ConditionType>, };

export type Condition = { "type": "buttonPressed", button: GamepadButton, } | { "type": "buttonNotPressed", button: GamepadButton, };

export type ConditionType = { "operator": "and" } & Condition | { "operator": "or" } & Condition;

export type Direction = "up" | "down" | "left" | "right";

export type Mapping = { "type": "buttonPressed" } & ButtonMapping | { "type": "axisTrigger" } & AxisTriggerMapping | { "type": "axisStick" } & AxisStickMapping;

export type MouseButton = "left" | "right" | "middle";

export type MouseMoveMode = "relative" | "absolute";

export type StickType = "leftStick" | "rightStick";
