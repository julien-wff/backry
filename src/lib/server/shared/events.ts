import type { backups, restores } from '$lib/server/db/schema';
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

// Backups
export type BackupUpdateEventPayload =
    Partial<typeof backups.$inferSelect>
    & Pick<typeof backups.$inferSelect, 'id'>;

export interface BackupEvents {
    update: [ BackupUpdateEventPayload ];
}

export const backupEmitter = new EventEmitter<BackupEvents>();

// Restores
export type RestoreUpdateEventPayload =
    Partial<typeof restores.$inferSelect>
    & Pick<typeof restores.$inferSelect, 'id'>;

export interface RestoreEvents {
    update: [ RestoreUpdateEventPayload ];
}

export const restoreEmitter = new EventEmitter<RestoreEvents>();
