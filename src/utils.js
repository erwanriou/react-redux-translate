// @flow
import React from "react"

export const getLocalizedElement = options => {
  const { translation, data, renderInnerHtml } = options
  const translatedValueOrArray = templater(translation, data)

  if (typeof translatedValueOrArray === "string") {
    return renderInnerHtml === true && hasHtmlTags(translatedValueOrArray)
      ? React.createElement("span", { dangerouslySetInnerHTML: { __html: translatedValueOrArray } })
      : translatedValueOrArray
  }

  for (let portion of translatedValueOrArray) {
    if (typeof portion === "string" && hasHtmlTags(portion)) {
      warning("HTML tags in the translation string are not supported when passing React components as arguments to the translation.")
      return ""
    }
  }

  // return as Element
  return React.createElement("span", null, ...translatedValueOrArray)
}

export const hasHtmlTags = value => {
  const pattern = /(&[^\s]*;|<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[\^'">\s]+))?)+\s*|\s*)\/?>)/
  return value.search(pattern) >= 0
}

export const templater = (strings, data = {}) => {
  if (!strings) return ""

  const genericPlaceholderPattern = "(\\${\\s*[^\\s}]+\\s*})"
  let splitStrings = strings
    .split(new RegExp(genericPlaceholderPattern, "gmi"))
    .filter(str => !!str)
    .map(templatePortion => {
      let matched
      for (let prop in data) {
        if (matched) break
        const pattern = "\\${\\s*" + prop + "\\s*}"
        const regex = new RegExp(pattern, "gmi")
        if (regex.test(templatePortion)) matched = data[prop]
      }
      if (typeof matched === "undefined") return templatePortion
      return matched
    })

  if (splitStrings.some(portion => React.isValidElement(portion))) {
    return splitStrings
  }

  return splitStrings.reduce((translated, portion) => {
    return translated + `${portion}`
  }, "")
}

export const getIndexForLanguageCode = (code, languages) => {
  return languages.map(language => language.code).indexOf(code)
}

export const objectValuesToString = data => {
  return !Object.values
    ? Object.keys(data)
        .map(key => data[key].toString())
        .toString()
    : Object.values(data).toString()
}

export const validateOptions = options => {
  if (options.onMissingTranslation !== undefined && typeof options.onMissingTranslation !== "function") {
    throw new Error("react-localize-redux: an invalid onMissingTranslation function was provided.")
  }

  if (options.renderToStaticMarkup !== false && typeof options.renderToStaticMarkup !== "function") {
    throw new Error(`
      react-localize-redux: initialize option renderToStaticMarkup is invalid.
      Please see https://ryandrewjohnson.github.io/react-localize-redux-docs/#initialize.
    `)
  }

  return options
}

export const getTranslationsForLanguage = (language, languages, translations) => {
  // no language! return no translations
  if (!language) {
    return {}
  }

  const { code: languageCode } = language
  const languageIndex = getIndexForLanguageCode(languageCode, languages)
  const keys = Object.keys(translations)
  const totalKeys = keys.length
  const translationsForLanguage = {}

  for (let i = 0; i < totalKeys; i++) {
    const key = keys[i]
    translationsForLanguage[key] = translations[key][languageIndex]
  }

  return translationsForLanguage
}

export const storeDidChange = (store, onChange) => {
  let currentState

  function handleChange() {
    const nextState = store.getState()
    if (nextState !== currentState) {
      onChange(currentState)
      currentState = nextState
    }
  }

  const unsubscribe = store.subscribe(handleChange)
  handleChange()
  return unsubscribe
}

export const getSingleToMultilanguageTranslation = (language, languageCodes, flattenedTranslations, existingTranslations) => {
  const languageIndex = languageCodes.indexOf(language)
  const translations = languageIndex >= 0 ? flattenedTranslations : {}
  const keys = Object.keys(translations)
  const totalKeys = keys.length
  const singleLanguageTranslations = {}

  for (let i = 0; i < totalKeys; i++) {
    const key = keys[i]
    const translationValues = languageCodes.map((code, index) => {
      const existingValues = existingTranslations[key] || []
      return index === languageIndex ? flattenedTranslations[key] : existingValues[index]
    })

    singleLanguageTranslations[key] = translationValues
  }

  return singleLanguageTranslations
}

export const get = (obj, path, defaultValue = undefined) => {
  const pathArr = path.split(".").filter(Boolean)
  return pathArr.reduce((ret, key) => {
    return ret && ret[key] ? ret[key] : defaultValue
  }, obj)
}

export const warning = message => {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(message)
  }

  try {
    throw new Error(message)
  } catch (e) {}
}
