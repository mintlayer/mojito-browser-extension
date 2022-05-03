# Mojito Browser Extension

## Setup
Just clone the project, install deps and you are good to go:
```
git clone git@github.com:mintlayer/mojito-browser-extension.git
cd mojito-browser-extension
npm i
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

## How to Contribute

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