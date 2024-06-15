# react-redux-translate

## INSTALLATION

```bash
npm i --save react-redux-translates
```

## IMPLEMENTATION

Make sure to work in a redux environment

```bash
# This example is done with the old redux version but can also be implemented with redux toolkit
npm i --save redux@4.2.1 redux-thunk@2.3.0 react-redux@7.2.4
npm i --save-dev @redux-devtools/extension@3.2.2
```

1. Create a `utils/index.js` file and add the following configurations

```js
import { renderToStaticMarkup } from "react-dom/server"

// IMPORT TRANSLATIONS JSON FILE HERE FROM WHERE THEY ARE
import US from "@translations/us.translations.json"
import FR from "@translations/fr.translations.json"

// DEFINE LANGUAGES
const languages = [
  { name: "en-US", code: "us", translation: US },
  { name: "fr-FR", code: "fr", translation: FR }
  // ADD THE LANGUAGES YOU NEED HERE...
]
export const activateTranslations = addtranslate => languages.map(({ translation, code }) => addtranslate(translation, code))
export const initialize = () => ({
  languages: languages.map(({ name, code }) => ({ name, code })),
  translation: US,
  options: { renderToStaticMarkup }
})
```

---

2. Create a minimal redux configuration within a `store` folder with an `index.js` and also create 2 folders `reducer` and `middlewares` **within** the `store` folder with also an `index.js`

2.1 - `store/index.js`

```js
import middlewares from "./middlewares"
import reducer from "./reducers"
import { composeWithDevTools } from "@redux-devtools/extension"
import { legacy_createStore as createStore } from "redux"

const options = {
  // OPTIMIZE REDUX DEVTOOL DUE TO SIZE OF STATE
  maxAge: 20,
  trace: false,
  shouldRecordChanges: false
}

const composeEnhancers = composeWithDevTools(options)
const isProd = process.env.NODE_ENV === "production"
export const store = isProd ? createStore(reducer(), middlewares) : createStore(reducer(), composeEnhancers(middlewares))
```

2.2 - `store/reducer/index.js`

```js
import { combineReducers } from "redux"
import { localizeReducer } from "react-redux-translates"

const reducer = () => combineReducers({ localize: localizeReducer })

export default reducer
```

2.3 - `store/middlewares/index.js`

```js
import thunk from "redux-thunk"
import { applyMiddleware } from "redux"

// IMPORT MIDDLEWARES
export default applyMiddleware(thunk)
```

---

3. then within the `index.js` make sure to wrap the `<App>` with `<LocalizeProvider>`

```js
import React from "react"
import { render } from "react-dom"

// TRANSLATION IMPORTS
import { LocalizeProvider } from "react-redux-translates"
import { initialize } from "@utils"
// REDUX IMPORTS
import { Provider } from "react-redux"
import { store } from "./store"

// COMPONENTS
import App from "./components/App"

const rootElement = document.getElementById("root")
const appRender = (
  <Provider store={store}>
    <LocalizeProvider store={store} initialize={initialize()}>
      <App />
    </LocalizeProvider>
  </Provider>
)

render(appRender, rootElement)
```

---

4. Import Translations into `App.js`

```js
import React, { useEffect } from "react"
import { withLocalize, getTranslate } from "react-redux-translates"
import { activateTranslations } from "@utils"

const App = ({
  addTranslationForLanguage,
  setActiveLanguage,
  languages,
  translate
}) => {
  // USE ONCE
  useEffect(() => {
    activateTranslations(addTranslationForLanguage)
  }, [])

  // MAIN RENDER WITH EXAMPLE OF PROPS PASSED THROUGH FOOTER
  return (
    <>
      <Header  />
      <Footer setActiveLanguage={setActiveLanguage} languages={languages} />
    </>
  )
}

const mapStateToProps = state => ({
  translate: getTranslate(state.localize),
})

export default withLocalize(mapStateToProps)(App))
```

---

5. Usage within component `Header.js` for example

```js
import React from "react"
import { useDispatch, useSelector } from "react-redux"

const Header = () => {
  // HOOKS
  const translate = useSelector(state => getTranslate(state.localize))

  return (
    <header>
      <h1>{translate("some.translation.string")}</h1>
    </header>
  )
}

export default Header
```
