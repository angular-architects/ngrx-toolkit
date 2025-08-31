import {
  HttpClient,
  HttpContext,
  HttpEventType,
  HttpHeaders,
  HttpParams,
  HttpProgressEvent,
  HttpResponse,
} from '@angular/common/http';
import { inject, Signal, signal } from '@angular/core';
import { defer, filter, map, tap } from 'rxjs';
import { Mutation } from './mutation';
import { rxMutation, RxMutationOptions } from './rx-mutation';

// The HttpClient defines these types as part of the method signature and
// not as a named type
export type HttpMutationRequest = {
  url: string;
  method: string;
  body?: unknown;
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  reportProgress?: boolean;
  params?:
    | HttpParams
    | Record<
        string,
        string | number | boolean | ReadonlyArray<string | number | boolean>
      >;
  withCredentials?: boolean;
  credentials?: RequestCredentials;
  keepalive?: boolean;
  priority?: RequestPriority;
  cache?: RequestCache;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  transferCache?:
    | {
        includeHeaders?: string[];
      }
    | boolean;
};

export type HttpMutationOptions<P, R> = Omit<
  RxMutationOptions<P, R>,
  'operation'
> & {
  request: (param: P) => HttpMutationRequest;
};

export type HttpMutation<P, R> = Mutation<P, R> & {
  uploadProgress: Signal<HttpProgressEvent | undefined>;
  downloadProgress: Signal<HttpProgressEvent | undefined>;
  headers: Signal<HttpHeaders | undefined>;
  statusCode: Signal<string | undefined>;
};

/**
 * Creates an HTTP mutation.
 *
 * export type Params = {
 *   value: number;
 * };
 *
 * export type CounterResponse = {
 *   // httpbin.org echos the request using the
 *   // json property
 *   json: { counter: number };
 * };
 *
 * private saveToServer = httpMutation<Params, CounterResponse>({
 *   request: (p) => ({
 *     url: `https://httpbin.org/post`,
 *     method: 'POST',
 *     body: { counter: p.value },
 *     headers: { 'Content-Type': 'application/json' },
 *   }),
 *   onSuccess: (response) => {
 *     console.log('Counter sent to server:', response);
 *   },
 *   onError: (error) => {
 *     console.error('Failed to send counter:', error);
 *   },
 * });
 *
 * ...
 *
 * const result = await this.saveToServer({ value: 17 });
 * if (result.status === 'success') {
 *   console.log('Successfully saved to server:', result.value);
 * }
 * else if (result.status === 'error') {
 *   console.log('Failed to save:', result.error);
 * }
 * else {
 *   console.log('Operation aborted');
 * }
 *
 * @param options The options for the HTTP mutation.
 * @returns The HTTP mutation.
 */
export function httpMutation<P, R>(
  options: HttpMutationOptions<P, R>,
): HttpMutation<P, R> {
  const httpClient = inject(HttpClient);

  const uploadProgress = signal<HttpProgressEvent | undefined>(undefined);
  const downloadProgress = signal<HttpProgressEvent | undefined>(undefined);
  const headers = signal<HttpHeaders | undefined>(undefined);
  const statusCode = signal<string | undefined>(undefined);

  const mutation = rxMutation({
    ...options,
    operation: (param: P) => {
      const httpRequest = options.request(param);

      return defer(() => {
        uploadProgress.set(undefined);
        downloadProgress.set(undefined);
        headers.set(undefined);
        statusCode.set(undefined);

        return httpClient
          .request<R>(httpRequest.method, httpRequest.url, {
            ...httpRequest,
            observe: 'events',
            responseType: 'json',
          })
          .pipe(
            tap((response) => {
              if (response.type === HttpEventType.UploadProgress) {
                uploadProgress.set(response);
              } else if (response.type === HttpEventType.DownloadProgress) {
                downloadProgress.set(response);
              }
            }),
            filter((event) => event instanceof HttpResponse),
            tap((response) => {
              headers.set(response.headers);
              statusCode.set(response.status.toString());
              console.log('HTTP response body:', response.body);
            }),
            map((event) => event.body as R),
          );
      });
    },
  }) as HttpMutation<P, R>;

  mutation.uploadProgress = uploadProgress;
  mutation.downloadProgress = downloadProgress;
  mutation.statusCode = statusCode;
  mutation.headers = headers;

  return mutation;
}
