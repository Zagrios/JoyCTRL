import { Observable, ReplaySubject, share } from "rxjs";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { IpcChannels, IpcRequestType, IpcResponseType } from "../ts/ipcs/ipc-routes";

export class IpcService {
	private static instance: IpcService;

	public static getInstance(): IpcService {
		if (!IpcService.instance) {
			IpcService.instance = new IpcService();
		}
		return IpcService.instance;
	}

	private readonly rootChannel = "joyctrl_ipc";
	private readonly teardownRoute = "teardown";

	constructor() {}

	public send<C extends IpcChannels>(channel: C, data?: IpcRequestType<C>): Observable<IpcResponseType<C>> {
		return new Observable<IpcResponseType<C>>(observer => {

			const uuid = Math.random().toString(36).substring(2, 15);

			const request: IpcRequest = {
				channel,
				stream_uuid: uuid,
				data,
			};

			const dataChannel = `${request.stream_uuid}_data`;
			const errorChannel = `${request.stream_uuid}_error`;
			const closeChannel = `${request.stream_uuid}_close`;

			const unlistenResp = listen(dataChannel, event => {
				observer.next(event.payload as IpcResponseType<C>);
			});

			const unlistenError = listen(errorChannel, event => {
				observer.error(new Error(event.payload as string));
			});

			const unlistenClose = listen(closeChannel, () => {
				observer.complete();
			});

			invoke(this.rootChannel, {
				request,
			}).catch(error => {
				observer.error(error);
			});

			return () => {
				unlistenResp.then(unlisten => {
					unlisten();
				}).catch(error => {
					console.log("unlistenResp error", error);
				});

				unlistenError.then(unlisten => {
					unlisten();
				}).catch(error => {
					console.log("unlistenError error", error);
				});

				unlistenClose.then(unlisten => {
					unlisten();
				}).catch(error => {
					console.log("unlistenClose error", error);
				});

				const request: IpcRequest = {
					channel: this.teardownRoute,
					stream_uuid: uuid,
				};

				invoke(this.rootChannel, { request }).catch(error => {
					console.log("teardownChannel error", error);
				});
			};
		}).pipe(share({connector: () => new ReplaySubject(1)}));
	}
}

export type IpcRequest<T = unknown> = {
	channel: string;
	stream_uuid: string;
	data?: T;
};

export type IpcTeardownRequest = {
	teardown_channel: string;
};
