Every new feature needs to come with following things:

An RFC on GitHub where it is decided if the feature is going to be implemented or not, including some basic implementation and design details.

SignalStore features start with an `with`, followed by the feature name. For example, `with-encryption`. You create it the source file in `libs/ngrx-toolkit/src/lib`.

If the feature does not fit into one file, divide it up into multiple files and put them into a folder with the same name as the feature. For example, as it is done with `withDevtools()`.

In case the feature uses third-party libraries, we need to provide a secondary entry point. An existing example is the `redux-connector` in `libs/ngrx-toolkit/redux-connector`.

Further necessary things for a new feature:

- Test
  - Unit Tests
  - E2E Tests
- Documentation in
  - `/docs`
  - as well at the function itself via JSDoc
