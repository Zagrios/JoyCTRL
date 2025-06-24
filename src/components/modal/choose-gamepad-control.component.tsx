import { useCallback, useEffect } from 'react'
import { ModalComponent, ModalExitCode, ModalService } from '../../services/modal.service'
import { GamepadAxis, GamepadButton } from '../../ts/bindings/gamepad'
import { Gamepad } from '../../ts/model/gamepad'
import { ModalTitle } from './modal-title.component'
import { useConstant } from '../../hooks/use-constant.hook'
import { AxisStickMapping, AxisTriggerMapping, ButtonMapping, StickType } from '../../ts/bindings/mapping'
import { useService } from '../../hooks/use-service.hook'
import { useObservable } from '../../hooks/use-observable.hook'
import { distinctUntilChanged, map } from 'rxjs'
import { deepEqual } from 'fast-equals'
import { ButtonMappingModal } from './button-mapping-modal.component'
import { MappingsService } from '../../services/mappings.service'
import { StickMappingModal } from './stick-mapping-modal.component'

export const ChooseGamepadControl: ModalComponent<{axis: GamepadAxis, button: GamepadButton}, Gamepad> = ({ resolver, options: { data: gamepad } }) => {

    const modal = useService(ModalService);
    const mappingService = useService(MappingsService);

    const mappings = useObservable<{
        buttons: Record<GamepadButton, ButtonMapping[]>,
        sticks: Record<StickType, AxisStickMapping[]>,
        triggers: Record<GamepadAxis, AxisTriggerMapping[]>,
    }>(() => mappingService.$mappings().pipe(map(mappings => {
        return {
            buttons: mappings?.filter(mapping => mapping.type === "buttonPressed")?.reduce((acc, mapping) => {
                acc[mapping.button] = [...(acc[mapping.button] ?? []), mapping];
                return acc;
            }, {} as Record<GamepadButton, ButtonMapping[]>) ?? {},
            sticks: mappings?.filter(mapping => mapping.type === "axisStick")?.reduce((acc, mapping) => {
                acc[mapping.stick] = [...(acc[mapping.stick] ?? []), mapping];
                return acc;
            }, {} as Record<StickType, AxisStickMapping[]>) ?? {},
            triggers: mappings?.filter(mapping => mapping.type === "axisTrigger")?.reduce((acc, mapping) => {
                acc[mapping.axis] = [...(acc[mapping.axis] ?? []), mapping];
                return acc;
            }, {} as Record<GamepadAxis, AxisTriggerMapping[]>) ?? {},
        }
    }), distinctUntilChanged(deepEqual)));
    
    const sitcks = useConstant<StickType[]>(["leftStick", "rightStick"]);
    const triggers = useConstant<GamepadAxis[]>(["triggerLeft", "triggerRight"]);

    useEffect(() => {
        if(!gamepad){
            resolver({exitCode: ModalExitCode.CANCELED});
        }
    }, [gamepad])

    const openButtonMappingModal = useCallback(async (button: GamepadButton) => {
        if(!gamepad){
            return;
        }

        await modal.openModal(ButtonMappingModal, {
            data: {
                gamepad,
                button,
            }
        })
    }, [gamepad, mappings])

    const openStickMappingModal = useCallback(async (stick: StickType) => {
        if(!gamepad){
            return;
        }

        await modal.openModal(StickMappingModal, {
            data: {
                gamepad,
                stick,
            }
        })
    }, [gamepad, mappings])

    return (
        <div className="flex flex-col h-full">
            <ModalTitle title="Mappings" onBack={() => resolver({ exitCode: ModalExitCode.CLOSED })}/>
            <div className="grow overflow-y-scroll flex flex-col gap-2 pb-2 scrollbar-default">
                <span className="block rounded-md font-bold m-2 px-1.5">Axis</span>
                {sitcks.map(stick => {
                    return (
                        <div key={stick} className="flex flex-row justify-between bg-gray-200 mx-2 rounded-md p-2 cursor-pointer transition-colors hover:bg-gray-300" role="button" onClick={() => openStickMappingModal(stick)}>
                            <div className='flex flex-col'>
                                <span>{stick}</span>
                                <span className='text-sm text-gray-500'>{mappings?.sticks?.[stick]?.length ?? 0} mappings</span>
                            </div>
                            <div className="h-full flex items-center justify-center px-2">{">"}</div>
                        </div>
                    )
                })}
                {triggers.map(trigger => {
                    return (
                        <div key={trigger} className="flex flex-row justify-between bg-gray-200 mx-2 rounded-md p-2 cursor-pointer transition-colors hover:bg-gray-300">
                            <div className='flex flex-col'>
                                <span>{trigger}</span>
                                <span className='text-sm text-gray-500'>{mappings?.triggers?.[trigger]?.length ?? 0} mappings</span>
                                </div>
                            <div className="h-full flex items-center justify-center px-2">{">"}</div>
                        </div>
                    )
                })}

                <span className="block rounded-md font-bold mx-2 my-2 px-1.5">Buttons</span>
                {(Object.keys(gamepad?.buttons() ?? {}) as GamepadButton[]).filter(button => !gamepad?.getButtonMask().includes(button)).sort().sort((a, b) => (a.length) - (b.length)).map(button => {
                    return (
                        <div key={button} className="flex flex-row justify-between bg-gray-200 mx-2 rounded-md p-2 cursor-pointer transition-colors hover:bg-gray-300" role="button" onClick={() => openButtonMappingModal(button)}>
                            <div className='flex flex-col'>
                                <span>{`${gamepad?.brand()}_${button}`}</span>
                                <span className='text-sm text-gray-500'>{mappings?.buttons?.[button]?.length ?? 0} mappings</span>
                            </div>
                            <div className="h-full flex items-center justify-center px-2">{">"}</div>
                        </div>
                    )
                })}
            </div>
            
        </div>
    )
}
