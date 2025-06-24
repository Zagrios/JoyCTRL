import { distinctUntilChanged, lastValueFrom, map, Observable, take } from "rxjs";
import { ConfigService } from "./config.service";
import { AxisStickMapping, AxisTriggerMapping, ButtonMapping, Mapping, StickType } from "../ts/bindings/mapping";
import { GamepadAxis, GamepadButton } from "../ts/bindings/gamepad";
import { deepEqual } from "fast-equals";

export class MappingsService {

    private static instance: MappingsService;

    public static getInstance(): MappingsService {
        if (!MappingsService.instance) {
            MappingsService.instance = new MappingsService();
        }
        return MappingsService.instance;
    }

    private readonly config: ConfigService;

    private constructor() {
        this.config = ConfigService.getInstance();
    }

    public $mappings(): Observable<Mapping[]> {
        return this.config.$get("mappings").pipe(map(mappings => mappings ?? []), distinctUntilChanged(deepEqual));
    }

    public async mappings(): Promise<Mapping[]> {
        return lastValueFrom(this.$mappings().pipe(take(1)));
    }

    public $buttonMappings(button: GamepadButton): Observable<ButtonMapping[]> {
        return this.$mappings().pipe(map(mappings => (mappings?.filter(mapping => mapping.type === "buttonPressed" && mapping.button === button) ?? []) as ButtonMapping[]));
    }

    public $stickMappings(stick: StickType): Observable<AxisStickMapping[]> {
        return this.$mappings().pipe(map(mappings => mappings.filter(mapping => mapping.type === "axisStick" && mapping.stick === stick) as AxisStickMapping[]));
    }

    public $triggerMappings(trigger: GamepadAxis): Observable<AxisTriggerMapping[]> {
        return this.$mappings().pipe(map(mappings => mappings.filter(mapping => mapping.type === "axisTrigger" && mapping.axis === trigger) as AxisTriggerMapping[]));
    }

    public async addMapping(mapping: Mapping): Promise<void> {
        const mappings = await this.mappings();
        console.log("addMapping",  [...mappings, mapping]);
        return lastValueFrom(this.config.$set("mappings", [...mappings, mapping]));
    }

    public async removeMapping(id: Mapping["id"]): Promise<void> {
        const mappings = await this.mappings();
        return lastValueFrom(this.config.$set("mappings", mappings.filter(m => m.id !== id)));
    }

    public async updateMapping(mapping: Mapping): Promise<void> {
        const mappings = await this.mappings();
        console.log("updateMapping", mapping);
        return lastValueFrom(this.config.$set("mappings", mappings.map(m => m.id === mapping.id ? mapping : m)));
    }

}