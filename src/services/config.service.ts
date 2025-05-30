import { distinctUntilChanged, map, Observable } from "rxjs";
import { Config } from "../ts/bindings/config";
import { IpcService } from "./ipc.service";
import { deepEqual } from "fast-equals";

export class ConfigService {


    private static instance: ConfigService;

    public static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }


    private readonly ipc: IpcService;

    private constructor() {
        this.ipc = IpcService.getInstance();
    }

    public $config(): Observable<Config> {
        return this.ipc.send("get-config").pipe(distinctUntilChanged(deepEqual));
    }

    public $get<C extends ConfigKey>(key: C): Observable<ConfigType<C>> {
        return this.$config().pipe(map(config => config?.[key]), distinctUntilChanged(deepEqual));
    }

    public $set<C extends ConfigKey>(key: C, value: ConfigType<C>): Observable<void> {
        return this.ipc.send("set-config", { key, value });
    }

    
    
}

export type ConfigKey = keyof Config;
export type ConfigType<C extends ConfigKey> = Config[C];
