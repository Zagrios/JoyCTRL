import { ConfigKey, ConfigType } from "../../services/config.service";
import { Config } from "../bindings/config";
import { GamepadState } from "../bindings/gamepad";

export interface IpcChannelMapping {
		"controllers-states": { request: void; response: GamepadState[] }
        "get-config": { request: void; response: Config }
        "set-config": { request: { key: ConfigKey; value: ConfigType<ConfigKey> }; response: void }
        "open-file": { request: void; response: string | null }
        "toogle-mapping-active": { request: void; response: void }
        "is-mapping-active": { request: void; response: boolean }
        "toogle-virtual-keyboard": { request: void; response: void }
        "press-keys": { request: string[]; response: void }
        "release-keys": { request: string[]; response: void }
        "write-text": { request: string; response: void }
        "on-vk-key-pressed": { request: void; response: string }
}

export type IpcRequestType<Channel extends keyof IpcChannelMapping> = IpcChannelMapping[Channel]["request"];
export type IpcResponseType<Channel extends keyof IpcChannelMapping> = IpcChannelMapping[Channel]["response"];
export type IpcChannels = keyof IpcChannelMapping;
