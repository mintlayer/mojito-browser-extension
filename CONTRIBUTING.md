# How to Contribute

Follow this for each task:

- Move your Asana task to `In Progress` column on the project board
- Create a new branch named `A-[id of Asana task]`
  - E.g.:
  ```
  git checkout main
  git checkout -b A-1202012043191654
  ```
- Do as many commits as you need.
- Push the branch to the remote repo:
  - E.g.:
  ```
  git push origin A-1202012043191654
  ```
- Create your PR setting a title like `A-[id of Asana task]: [short description]`:
  - E.g.: `A-1202012043191654: Update README with branches info`
- Set some relevant reviewers to your PR
- Move your Asana task to `On Staging (to be tested)` column on the project board
- After getting the approval of all of the selected reviewers, merge your branch with `Squash and merge`
- Remove your branch after merging
- Move your asana task to `Ready do be deployed`

## File Structure

This part is meant to describe how the project is structured. So if you are creating a new feature or fixing something, you should follow this organization.

[You can see a visual representation of the file structure here.](./FileStructure.jpg)

### SRC

#### Components

Main directory for React components.

Each `Component` should be on its own folder with its own tests, storybook, and CSS files.

Everything should have visual tests in this folder. Unit tests can be done if needed

:no_entry_sign: Do not use inside components :no_entry_sign:

- Redirects to other routes.
- `Service` dependencies like:
  - **@APIs**
  - **@Databases**
  - **@Cryptos**
  - **@Entities**

##### Basic (import from @BasicComponents)

Only visual components which use **only** simple HTML elements should be here.

Components here should be generic. No specific logic or properties should be in these components.

##### Composed (import from @ComposedComponents)

Visual components which are made of other components, with or without extra HTML elements.

Components here should be generic. No specific logic or properties should be in these components.

##### Containers (import from @ContainerComponents)

Visual components used by a specific `Page`. They could be build out of `Basic` and/or `Composed`, with or without extra HTML elements.

Also, here it is allowed to have specific logic and properties.

---

#### Hooks (import from @Hooks)

Project's custom hooks.

Each `Hook` should be on its own folder with its own tests file.

Everything should have a unit test here.

---

#### Contexts (import from @Contexts)

Projects custom contexts.

Each `Context` should be on its own folder with its own tests file.

Everything should have a unit test here.

---

##### Assets

###### Styles (import from @Assets/styles/{file}.css)

Common styles and CSS variables that will affect or be used throught the whole app.

###### Images (import from @Assets/images/{image}.{svg|png|jpg})

Common image that be used throught the whole app.

---

##### Services

Not visual dependencies should be in this directory.

###### API (import from @APIs)

Connections to external services should be in this directory.

Ex.: Coinlayer.com, Electrum server...

Each external service should be on its own folder with its own test file.

###### Database (import from @Databases)

Connections to databases should be in this directory.

Ex.: IndexedDB, LocalStorage...

Each database `Service` should be on its own folder with its own test file. If a WebWorker is needed should be in its own folder as well.

###### Crypto (import from @Cryptos)

Blockchain token and encryption functions should be in this directory.

Ex.: BTC, MLT, ETH, AES, PBKDF2...

Each crypto `Service` should be on its own folder with its own test file. If a WebWorker is needed it should be in this folder as well.

###### Entity (import from @Entities)

Entities that are saved in the app should be in this directory.

Ex.: Account.

Each entity `Service` should be on its own folder with its own test file. If a WebWorker, or WebWorkers consumer, is needed it should be in this folder as well.

---

##### Pages (import from @Pages)

Every page, **related to a route** in `src/index.js`, should be here.

The components used here should be imported just from its own **Container** folder.

Any `Service` should be used just here. If a `Component` needs something from the service, it should be passed from here as **prop**.

Redirects to other routes should be here.

Each page should be on its own folder with its own CSS file.

Pages should be tested with E2E tests. E2E tests should be written accordingly to the related User Story(ies).
