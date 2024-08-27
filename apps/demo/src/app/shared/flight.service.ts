import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, firstValueFrom, catchError, of } from 'rxjs';
import { EntityId } from '@ngrx/signals/entities';
import { DataService } from 'ngrx-toolkit';
import { Flight } from './flight';

export type FlightFilter = {
  from: string;
  to: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlightService implements DataService<Flight, FlightFilter> {
  baseUrl = `https://demo.angulararchitects.io/api`;

  constructor(private http: HttpClient) {}

  loadById(id: EntityId): Promise<Flight> {
    return firstValueFrom(this.findById('' + id));
  }

  create(entity: Flight): Promise<Flight> {
    entity.id = 0;
    return firstValueFrom(this.save(entity));
  }

  update(entity: Flight): Promise<Flight> {
    return firstValueFrom(this.save(entity));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAll(entity: Flight[]): Promise<Flight[]> {
    throw new Error('updateAll method not implemented.');
  }

  delete(entity: Flight): Promise<void> {
    return firstValueFrom(this.remove(entity));
  }

  load(filter: FlightFilter): Promise<Flight[]> {
    return firstValueFrom(this.find(filter.from, filter.to));
  }

  private find(
    from: string,
    to: string,
    urgent = false
  ): Observable<Flight[]> {
    let url = [this.baseUrl, 'flight'].join('/');

    if (urgent) {
      url = [this.baseUrl, 'error?code=403'].join('/');
    }

    const params = new HttpParams().set('from', from).set('to', to);
    const headers = new HttpHeaders().set('Accept', 'application/json');
    return this.http.get<Flight[]>(url, { params, headers });
  }

  private findById(id: string): Observable<Flight> {
    const reqObj = { params: new HttpParams().set('id', id) };
    const url = [this.baseUrl, 'flight'].join('/');
    return this.http.get<Flight>(url, reqObj);
  }

  private save(flight: Flight): Observable<Flight> {
    const url = [this.baseUrl, 'flight'].join('/');
    return this.http.post<Flight>(url, flight);
  }

  private remove(flight: Flight): Observable<void> {
    const url = [this.baseUrl, 'flight', flight.id].join('/');
    return this.http.delete<void>(url);
  }

}

@Injectable({
  providedIn: 'root'
})
export class FlightServiceRXJS implements DataService<Flight, FlightFilter> {
  private url = 'http://localhost:3000/books';
  private http = inject(HttpClient);

  loadById(id: EntityId): Observable<Flight> {
    const reqObj = { params: new HttpParams().set('id', id) };
    return this.http
      .get<Flight>(this.url, reqObj)
      .pipe(catchError((_) => of<Flight>()));
  }

  create(entity: Flight): Observable<Flight> {
    return this.http
      .post<Flight>(this.url, entity)
      .pipe(catchError((_) => of<Flight>()));
  }

  update(entity: Flight): Observable<Flight> {
    return this.http
      .post<Flight>(this.url, entity)
      .pipe(catchError((_) => of<Flight>()));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAll(entity: Flight[]): Observable<Flight[]> {
    throw new Error('updateAll method not implemented.');
  }

  delete(entity: Flight): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${entity.id}`)
      .pipe(catchError((_) => of<void>()));
  }

  load(filter: FlightFilter): Observable<Flight[]> {
    console.log('loading');
    // TODO - actually add in filter
    return this.http
      .get<Flight[]>(this.url)
      .pipe(catchError((_) => of<Flight[]>([])));
  }
}
