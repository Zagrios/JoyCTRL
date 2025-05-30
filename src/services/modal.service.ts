import { JSX } from "react";
import { BehaviorSubject, Observable } from "rxjs";

export class ModalService {

    private static instance: ModalService;

    public static getInstance(): ModalService {
        if(!ModalService.instance) {
            ModalService.instance = new ModalService();
        }
        return ModalService.instance;
    }

    private readonly modals$: BehaviorSubject<ModalObject[]> = new BehaviorSubject<ModalObject[]>([]);

    private constructor() {}

    public openModal<T, K>(modal: ModalComponent<T, K>, options: ModalOptions<K>): Promise<ModalResponse<T>> {
        console.log("openModal", modal, options);
        let [promise, resolver] = (() => {
            let resolver = undefined;
            const promise = new Promise<ModalResponse<T>>((resolve) => {
                resolver = resolve as (value: ModalResponse | PromiseLike<ModalResponse>) => void;;
            });
            return [promise, resolver as unknown as (value: ModalResponse | PromiseLike<ModalResponse>) => void];
        })();
        const modalObj = {modal: modal as ModalComponent, resolver, options: options ?? {}};
        this.modals$.next([...this.modals$.getValue(), modalObj]);

        promise.then(() => {
            this.modals$.next(this.modals$.getValue().filter(m => m !== modalObj));
        });

        return promise;
    }

    public $getModals(): Observable<ModalObject[]> {
        return this.modals$.asObservable();
    }
    
}

export type ModalOptions<T = unknown> = { readonly data: T }
export type ModalComponent<Return = unknown, Receive = unknown> = ({ resolver, options }: { readonly resolver: (x: ModalResponse<Return>) => void; readonly options: ModalOptions<Receive>}) => JSX.Element;
export type ModalObject = {modal: ModalComponent, resolver: (value: ModalResponse | PromiseLike<ModalResponse>) => void, options: ModalOptions};

export const enum ModalExitCode {
    NO_CHOICE = -1,
    COMPLETED = 0,
    CLOSED = 1,
    CANCELED = 2,
}

export interface ModalResponse<T = unknown> {
    exitCode: ModalExitCode;
    data?: T;
}
