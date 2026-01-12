import { Injectable } from '@angular/core';

export type Address = {
  street: string;
  city: {
    zip: string;
    name: string;
  };
  country: string;
};

export const venice: Address = {
  street: 'Sestiere Dorsoduro, 2771',
  city: {
    zip: '30123',
    name: 'Venezia VE',
  },
  country: 'Italy',
};

export const vienna: Address = {
  street: 'Schottenring, 1',
  city: {
    zip: '1010',
    name: 'Vienna',
  },
  country: 'Austria',
};

@Injectable({ providedIn: 'root' })
export class AddressResolver {
  resolve(id: number) {
    void id;
    return Promise.resolve<Address>(this.address);
  }
}
