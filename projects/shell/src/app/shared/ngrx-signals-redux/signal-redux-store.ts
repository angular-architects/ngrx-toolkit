import { Injectable, inject } from "@angular/core";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { Action, ActionCreator } from "@ngrx/store";
import { map, pipe, tap } from "rxjs";
import { MapperTypes } from "./model";
import { isUnsubscribable } from "./util";


// TODO: Make rxMethod optional.
// TODO: Observable intergration for effects as offical rxMethod signature?
// TODO: Guards against reducer and effects mixed in one method.
@Injectable({
  providedIn: 'root'
})
export class SignalReduxStore {
  private mapperDict: Record<string, {
    storeMethod: (...args: unknown[]) => unknown,
    resultMethod?: (...args: unknown[]) => unknown
  }> = {};

  dispatch = rxMethod<Action>(pipe(
    tap((action: Action) => {
      const callbacks = this.mapperDict[action.type];
      if (callbacks?.storeMethod) {
        if (
          isUnsubscribable(callbacks.storeMethod) &&
          callbacks.resultMethod
        ) {
          return callbacks.storeMethod(action, callbacks.resultMethod) as any;
        }

        return callbacks?.storeMethod(action);
      }

      return action;
    })
  ));

  connectFeatureStore(mappers: MapperTypes<ActionCreator<any, any>[]>[]): void {
    mappers.forEach(
      mapper => mapper.types.forEach(
        action => this.mapperDict[action] = {
          storeMethod: mapper.storeMethod,
          resultMethod: mapper.resultMethod
        }
      )
    );
  }
}

export function injectReduxDispatch() {
  return inject(SignalReduxStore).dispatch;
}
