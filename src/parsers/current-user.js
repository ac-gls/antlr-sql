/**
 * @fileoverview Current User Store
 * Manages the state for the currently authenticated user using nanostores.
 * Provides reactive atoms for user data, login status, loading state, error handling, and loaded status.
 * @module store/current-user
 */

import { atom, task, onMount, allTasks, computed } from 'nanostores';
import { api } from '../lib/api';
import { ui_mode$ } from './ui';
import _ from 'underscore';
import { languages_$, languages_activeId$, getLanguageCookie, setActiveLanguage } from './languages';
import { compare } from '../lib/helpers';

/**
 * @typedef {Object} UserProfile
 * @property {number} id - Unique identifier for the user profile
 * @property {number} roleId - Role ID associated with this profile
 * @property {number} nodeId - Node ID associated with this profile
 * @property {boolean} active - Whether this profile is currently active
 */

/**
 * @typedef {Object} CurrentUser
 * @property {number} id - Unique identifier for the user
 * @property {string} userName - Username of the user
 * @property {string} email - Email address of the user
 * @property {number} roleId - Current role ID of the user
 * @property {number} nodeId - Current node ID of the user
 * @property {number} languageId - Preferred language ID
 * @property {string} settings - JSON string of user settings
 * @property {UserProfile[]} userProfiles - Array of user profiles
 * @property {Object[]} userSurveys - Array of user survey types
 * @property {Object[]} userPermissionGroups - Array of user permission groups
 * @property {Object[]} userAggregations - Array of user hierarchy aggregations
 * @property {Object[]} userDashboards - Array of user dashboards
 * @property {number} profileId - Active profile ID
 */

/**
 * Minimal writable atom shape used for JSDoc typing in this module.
 * @typedef {Object} WritableAtomLike
 * @property {function():*} get - Returns current atom value
 * @property {function(*):void} set - Sets atom value
 * @property {function(function(*,*):void):function():void} listen - Subscribes to changes
 */

/**
 * Minimal readable atom shape used for JSDoc typing in this module.
 * @typedef {Object} ReadableAtomLike
 * @property {function():*} get - Returns current atom value
 * @property {function(function(*,*):void):function():void} listen - Subscribes to changes
 */

/**
 * Atom containing the current user object.
 * @type {WritableAtomLike}
 */
const currentUser_$ = atom({});

/**
 * Computed atom indicating whether the user is logged in.
 * @type {ReadableAtomLike}
 */
const currentUser_loggedIn$ = computed(currentUser_$, (user) => !_.isEmpty(user));

/**
 * Atom indicating whether current user data is currently being loaded.
 * @type {WritableAtomLike}
 */
const currentUser_loading$ = atom(false);

/**
 * Atom containing the error message if the last load operation failed, or null if successful.
 * @type {WritableAtomLike}
 */
const currentUser_error$ = atom(null);

/**
 * Atom indicating whether current user has been loaded at least once.
 * @type {WritableAtomLike}
 */
const currentUser_loaded$ = atom(false);

/**
 * Lifecycle hook that runs when the first subscriber mounts to currentUser_$.
 * Automatically fetches current user and sets up language preferences.
 * @returns {Function} Cleanup function that unsubscribes all listeners
 */
onMount(currentUser_$, async () => {
    const unsubs = [];

    task(async () => {
        if (_.isEmpty(currentUser_$.get()) && !currentUser_loading$.get()) {
            const response = await loadCurrentUser();
            currentUser_$.set(response);
        }
    });

    task(async () => {
        const off = currentUser_$.listen(async (newValue, oldValue) => {
            if (_.isEmpty(newValue) && !currentUser_loading$.get()) {
                const response = await loadCurrentUser();
                currentUser_$.set(response);
            }
            
        });
        unsubs.push(off);
    });
    
    task(async () => {
        const cookie = await getLanguageCookie();
        const langCode = languages_$.get().find(x => x.id === Number(cookie))?.languageCode;
        setActiveLanguage(langCode);
    });

    await allTasks();
    
    return () => {
        unsubs.forEach(u => { try { u(); } catch { /* ignore */ } });
    };
});

/**
 * Fetches current user data from the API including related data (dashboards, surveys, permissions, aggregations).
 * Updates loading, error, and loaded state atoms during the request lifecycle.
 * @async
 * @function loadCurrentUser
 * @returns {Promise<CurrentUser|Object>} Current user object with related data, or empty object on error
 * @example
 * const user = await loadCurrentUser();
 * console.log(user); // { id: 1, userName: 'admin', roleId: 1, ... }
 */
const loadCurrentUser = async () => {

    if (currentUser_loading$.get()) return {};
    
    currentUser_loading$.set(true);
    currentUser_error$.set(null);
    
    try {
        let user = await api.get('users/current-user');
        ui_mode$.set(user.settings && JSON.parse(user.settings).mode ? JSON.parse(user.settings).mode : 'light');

        if (user.roleId) {

            let [userDashboards, userSurveys, userPermissionGroups, userAggregations] = await Promise.all([
                api.get(`roles/${user.roleId}/dashboards`),
                api.get('users/user-surveytypes'),
                api.get('users/user-permissiongroups'),
                api.get('users/user-hierarchyaggregations')
            ]);

            userDashboards = userDashboards.dashboards;

            if (user.userProfiles && (user.userProfiles.length > 0)) {
                user.userProfiles.forEach(x => {
                    (user.roleId === x.roleId) && (user.nodeId === x.nodeId) ? x.active = true : x.active = false
                });

                const activeProfile = user.userProfiles.find(x => x.active);
                if (activeProfile) {
                    user.profileId = activeProfile.id;
                }
            }

            currentUser_loaded$.set(true);
            return { ...user, userSurveys, userPermissionGroups, userAggregations, userDashboards };
        }
        currentUser_loaded$.set(true);
        return user ?? {};
    } catch (error) {
        console.error('loadCurrentUser error', error);
        currentUser_error$.set(error?.message ?? 'Failed to load current user');
        return {};
    } finally {
        currentUser_loading$.set(false);
    }
};

/**
 * Resets all current user state to initial values.
 * Clears user data, resets loading/error/loaded flags.
 * Useful for logout scenarios.
 * @function resetCurrentUser
 * @returns {void}
 * @example
 * // On user logout
 * resetCurrentUser();
 */
const resetCurrentUser = () => {
    currentUser_$.set({});
    currentUser_loading$.set(false);
    currentUser_error$.set(null);
    currentUser_loaded$.set(false);
};

/**
 * Saves user settings to the API if they have changed.
 * @async
 * @function saveUserSettings
 * @param {Object} settings - User settings to save
 * @param {number} settings.languageId - Language ID preference
 * @param {string} settings.settings - JSON string of user settings
 * @returns {Promise<void>}
 */
const saveUserSettings = async (settings) => {

    const currentUser = currentUser_$.get();

    if (
        !compare(currentUser.languageId, settings.languageId) &&
        !compare(currentUser.settings, settings.settings)
    ) {
        await api.put(`users/user-settings`, settings);
        resetCurrentUser();
    }

};

export {
    currentUser_$,
    currentUser_loggedIn$,
    currentUser_loading$,
    currentUser_error$,
    currentUser_loaded$,

    saveUserSettings,
    resetCurrentUser,
    loadCurrentUser
};