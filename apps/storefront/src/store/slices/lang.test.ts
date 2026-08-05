import { getGlobalTranslations, getPageTranslations } from '../appAsyncThunks';

import { langSlice, LangState } from './lang';

const { reducer } = langSlice;

const stateWith = (overrides: Partial<LangState>): LangState => ({
  translations: {},
  fetchedPages: [],
  translationVersion: 1,
  ...overrides,
});

describe('lang slice translation storage', () => {
  describe('getGlobalTranslations.fulfilled', () => {
    const staleState = stateWith({
      translations: {
        'global.button.back': '!!=Back',
        'global.button.next': '!!=Continue',
        'login.loginText.signInHeader': '!!=Sign in',
      },
      fetchedPages: ['global', 'login'],
    });

    it('replaces the global namespace when multi-language is enabled', () => {
      // The fetch only fires when the translation version changed, and phrases
      // the merchant deleted are absent from the response: keeping them around
      // would serve stale customizations forever. Only global.* is replaced;
      // other pages are cleaned up when they are refetched (fetchedPages is
      // reset below, so every page refetches this session).
      const action = getGlobalTranslations.fulfilled(
        {
          globalTranslations: { 'global.button.back': 'NEW_BACK' },
          newVersion: 2,
          multiLanguageEnabled: true,
        },
        'requestId',
        { channelId: 1, newVersion: 2 },
      );

      const state = reducer(staleState, action);

      expect(state.translations).toEqual({
        'global.button.back': 'NEW_BACK',
        'login.loginText.signInHeader': '!!=Sign in',
      });
      expect(state.translations['global.button.next']).toBeUndefined();
      expect(state.translationVersion).toBe(2);
      expect(state.fetchedPages).toEqual(['global']);
    });

    it('keeps the legacy merge behavior when multi-language is disabled', () => {
      const action = getGlobalTranslations.fulfilled(
        {
          globalTranslations: { 'global.button.back': 'NEW_BACK' },
          newVersion: 2,
          multiLanguageEnabled: false,
        },
        'requestId',
        { channelId: 1, newVersion: 2 },
      );

      const state = reducer(staleState, action);

      expect(state.translations).toEqual({
        'global.button.back': 'NEW_BACK',
        'global.button.next': '!!=Continue',
        'login.loginText.signInHeader': '!!=Sign in',
      });
    });
  });

  describe('getPageTranslations.fulfilled', () => {
    const staleState = stateWith({
      translations: {
        'global.button.back': '!!=Back',
        'login.button.signIn': '!!=SIGN IN',
        'login.loginText.signInHeader': '!!=Sign in',
        'login.loginText.forgotPasswordText': '!!=Forgot your password?',
        'quoteDraft.button.submit': '!!=Submit',
      },
      fetchedPages: ['global'],
    });

    it('replaces the fetched pages instead of merging when multi-language is enabled', () => {
      const action = getPageTranslations.fulfilled(
        {
          pageTranslations: {
            'login.button.signIn': '=~SIGN_IN~=',
            'login.loginText.signInHeader': '==SIGN_IN==',
          },
          page: 'login',
          fetchedDependencyPages: [],
          multiLanguageEnabled: true,
        },
        'requestId',
        { channelId: 1, page: 'login' },
      );

      const state = reducer(staleState, action);

      // forgotPasswordText was deleted by the merchant: it must not survive.
      expect(state.translations).toEqual({
        'global.button.back': '!!=Back',
        'login.button.signIn': '=~SIGN_IN~=',
        'login.loginText.signInHeader': '==SIGN_IN==',
        'quoteDraft.button.submit': '!!=Submit',
      });
      expect(state.fetchedPages).toEqual(['global', 'login']);
    });

    it('also replaces fetched dependency pages when multi-language is enabled', () => {
      const action = getPageTranslations.fulfilled(
        {
          pageTranslations: { 'quoteDetail.header.title': 'Title:' },
          page: 'quoteDetail',
          fetchedDependencyPages: ['quoteDraft'],
          multiLanguageEnabled: true,
        },
        'requestId',
        { channelId: 1, page: 'quoteDetail' },
      );

      const state = reducer(staleState, action);

      expect(state.translations['quoteDraft.button.submit']).toBeUndefined();
      expect(state.translations['quoteDetail.header.title']).toBe('Title:');
      expect(state.translations['login.loginText.signInHeader']).toBe('!!=Sign in');
    });

    it('keeps the legacy merge behavior when multi-language is disabled', () => {
      const action = getPageTranslations.fulfilled(
        {
          pageTranslations: { 'login.button.signIn': '=~SIGN_IN~=' },
          page: 'login',
          fetchedDependencyPages: [],
          multiLanguageEnabled: false,
        },
        'requestId',
        { channelId: 1, page: 'login' },
      );

      const state = reducer(staleState, action);

      expect(state.translations['login.button.signIn']).toBe('=~SIGN_IN~=');
      expect(state.translations['login.loginText.forgotPasswordText']).toBe(
        '!!=Forgot your password?',
      );
    });
  });
});
