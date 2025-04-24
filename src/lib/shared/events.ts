import type { getExecution } from '$lib/queries/executions';
import { EventEmitter as BaseEventEmitter } from 'node:events';

export class EventEmitter<TEvents extends Record<string, any>> {
    readonly #emitter = new BaseEventEmitter();

    get emitter() {
        return this.#emitter;
    }

    emit<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        ...eventArg: TEvents[TEventName]
    ) {
        this.#emitter.emit(eventName, ...(eventArg as []));
    }

    on<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void,
    ) {
        this.#emitter.on(eventName, handler as any);
    }

    off<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void,
    ) {
        this.#emitter.off(eventName, handler as any);
    }
}

export interface ExecutionEvents {
    update: [ Awaited<ReturnType<typeof getExecution>> ];
}

export const executionEmitter = new EventEmitter<ExecutionEvents>();
