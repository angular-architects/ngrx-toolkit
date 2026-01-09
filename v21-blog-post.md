# NgRx Toolkit v21

## TODO: Explain Toolkit

- It existed alreday at a time where the signalStore was not even stable
- It sees itself as rich set of extensions you need in typical Angular applications.
- Mention redux extension, but also maybe 2 further features from the beginning

The Toolkit originates as far back as when the SignalStore was not even marked stable.
As the package was in its early stages, community requests for various functionality
poured in. However, the NgRx team wanted to focus on core functionality that would be 
broadly usable and supported to their full standard. But they provided the tools for the 
community to make its own tools, the `signalStoreFeature` function. Rainer Hahnekamp 
saw the opportunity to house these tools inside what is now the NgRx Toolkit.

The NgRx Toolkit sees itself as rich set of extensions that you need in typical Angular applications. 
Core functionality and its history:

- `withDevtools()` that allows any SignalStore, redux/events based or not at all, to use the Redux Devtools. Your SignalStore state
can be visualized in the widely used plugin by just adding the `withDevtools('storeNameHere')` to a store. TODO - tease the events redux integration?
- The Toolkit introduced Redux functionality via `withRedux()` to the SignalStore ecosystem before it was later officially
introduced. Now that `@ngrx/signals/event` is stable, `withRedux()` usage should be transitioned to the official event API.
- `withStorageSync()` for synchronizing state with Web Storage (`localStorage`/`sessionStorage`) and IndexedDB (via an async strategy).
As easy as `withStorageSync('storeNameHere')`. IndexedDB was added last year by a [community contribution by GitHub user mzkmnk](https://github.com/angular-architects/ngrx-toolkit/pull/134).
- `withCallState()` which provides `setLoading`/`setLoaded`/`setError` as well as named collection support: `withCallState({ collection: 'todos' })` --> `setLoading('todos')`.
- `withFeature` of the SignalStore started out in the Toolkit as `withFeatureFactory`
- Other features can be found in the documentation: https://ngrx-toolkit.angulararchitects.io/docs/extensions

// TODO - some snippets? Screenshot(s)?

## But first: v20 minor features: `withResource`/`withEntityResources`/Mutations

Before talking about v21, there were two new features from v20 Toolkit minor versions: `withResource()` and its 
entity equivalent, `withEntityResources()`, as well as the Mutations API. 

`withResource` is a feature that connects Angular's Resource API with the store. The idea: you can use a store to directly manage async data 
(like loading from an API), and `withResource()` helps you wire that in. Features unnamed and named variants. `withEntityResources` provides 
the same functionality but for `@ngrx/signals/entities` based stores.

The Mutations API came in a later minor, providing the other pieces of the REST experience that mutations do not cover. Mutations come as either
standalone functions (`httpMutation`/`rxMutation`), as well as in a `withMutation` feature. The API was inspired by Angular Query and Marko Stanimirović's 
proposed mutations API for Angular. We also had internal discussions with Alex Rickabaugh on our design.

// TODO - snippets?

## TODO: v21

Finally, actual Toolkit v21 notes. Future posts that are not our debut blogpost for the library won't always have a three act structure with a detailed backstory, we promise.

The two major items for v21 tie into topics we already discussed:

- Better error handling for `withResource()` and `withEntityResources()`
- Events integration into the devtools

### Upgraded `withResource()` and `withEntityResources()` error handling

The error throwing behavior of Angular's resources proved tricky for the signal store. Deadlock scenario: once a resource is in an 
error state and we update a signal in `params`, the update calls `patchState`, which will again access the value of the state.

After a lot of experiemtnation, as well as discussion with various members of the Angular community, we arrived on an error handling 
strategy that gives Toolkit users a few options:

```ts
    // TODO - reduce indent
    type ErrorHandling = 'native' | 'undefined value' | 'previous value';

    withResource(
      (store) => {
        const resolver = inject(AddressResolver);
        return {
          address: resource({
            params: store.id,
            loader: ({ params: id }) => resolver.resolve(id),
          }),
        };
      },
      // Other values: 'native' and 'previous value'
      { errorHandling: 'undefined value' }, // default if not specified
    ),
```

Options:

1. `'undfined value'` (default). In the event of an error, the resource's value will be `undefined`
1. `'previous value'`. Provided the resource had a previous value, that previous value will be returned. If not, an error is thrown.
1. `'native'`. No special handling is provided, inline with default error behavior.

<!-- TODO - update link when the code is merged -->

Under the hood, `'previous value'` and `'undefined value'` proxy the value. For a detailed explanation for why this is done and what a more longterm solution may be with some framework enhancements, check out the [JSDoc for the error handling strategy](https://google.com).

### Events integration into devtools

There is some irony with this. The NgRx Toolkit brought events to the SignalStore before there was an official plugin, and the Toolkit 
provides Redux Devtools integration, with or without redux used. However, the now official NgRx events feature as it shaped up 
did not translate directly to working with the Toolkit's `withDevtools`.

In NgRx Toolkit v21, we are fixing this with `withTrackedReducer()`, an alternative approach to tracking reducer-based state changes in Redux DevTools.

```ts
// TODO - snippet with imports
```

## TODO (also decide location) - where to mention Murat's OpenAPI library based on the toolkit

We got a fantastic Christmas present from Murat Sari (TODO: social to link to?)

An OpenAPI generator that creates:

- ✅ an NgRx Signal Store
- ✅ with Resources
- ✅ and Mutations
- ✅ based on a Zod schema

On top of that, the generated code is genuinely beautiful – which is not something you usually 
see with code generators. [Check it out on npm](https://www.npmjs.com/package/ngrx-toolkit-openapi-gen), 
as well as [its documentation](https://coderabbit-gmbh.github.io/ngrx-toolkit-openapi-gen/).

## TODO - where to put this and what to say - our strategy to release a compatible minor with the next major in the future in a more timely manor
