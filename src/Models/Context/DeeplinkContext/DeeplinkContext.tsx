/**
 * This context is for transferring state from one session to another. These properties are managed by the various parts of the app and can be read onMount to restore the state
 */
import produce from 'immer';
import queryString from 'query-string';
import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import { ADTSelectedEnvironmentInLocalStorage } from '../../../Components/EnvironmentPicker/EnvironmentPicker.types';
import {
    ADT3DScenePageModes,
    SelectedContainerLocalStorageKey,
    SelectedEnvironmentLocalStorageKey
} from '../../Constants';
import { getDebugLogger } from '../../Services/Utils';
import { useConsumerDeeplinkContext } from '../ConsumerDeeplinkContext/ConsumerDeeplinkContext';
import {
    IDeeplinkContext,
    IDeeplinkContextState,
    DeeplinkContextAction,
    DeeplinkContextActionType,
    IDeeplinkOptions
} from './DeeplinkContext.types';
import {
    DEEPLINK_SERIALIZATION_OPTIONS,
    IDeeplinkContextProviderProps,
    IPublicDeeplink
} from '..';
import TelemetryService from '../../Services/TelemetryService/TelemetryService';

const debugLogging = false;
const logDebugConsole = getDebugLogger('DeeplinkContext', debugLogging);

// &mode=Viewer&sceneId=f7053e7537048e03be4d1e6f8f93aa8a&selectedElementIds=45131a84754280b924477f1df54ca547&selectedLayerIds=8904b620aa83c649888dadc7c8fdf492,9624b620aa83c649888dadc7c8fdf541&storageUrl=https://mockstorage.blob.core.windows.net/mockContainerName&adtUrl=https://mockadt.api.wcus.digitaltwins.azure.net

export const DeeplinkContext = React.createContext<IDeeplinkContext>(null);
export const useDeeplinkContext = () => useContext(DeeplinkContext);

export const DeeplinkContextReducer: (
    draft: IDeeplinkContextState,
    action: DeeplinkContextAction
) => IDeeplinkContextState = produce(
    (draft: IDeeplinkContextState, action: DeeplinkContextAction) => {
        logDebugConsole(
            'info',
            `Updating Deeplink context ${action.type} with payload: `,
            action.payload
        );
        switch (action.type) {
            case DeeplinkContextActionType.SET_ADT_URL: {
                draft.adtUrl = action.payload.url || '';
                updateSelectedEnvironmentInLocalStorage(action.payload.url);
                break;
            }
            case DeeplinkContextActionType.SET_ELEMENT_ID: {
                draft.selectedElementId = action.payload.id || '';
                break;
            }
            case DeeplinkContextActionType.SET_LAYER_IDS: {
                draft.selectedLayerIds = action.payload.ids || [];
                break;
            }
            case DeeplinkContextActionType.SET_MODE: {
                draft.mode = action.payload.mode;
                draft.selectedElementId = '';
                draft.selectedLayerIds = [];
                break;
            }
            case DeeplinkContextActionType.SET_SCENE_ID: {
                draft.sceneId = action.payload.sceneId || '';
                TelemetryService.setSceneId(draft.sceneId);
                break;
            }
            case DeeplinkContextActionType.SET_STORAGE_URL: {
                draft.storageUrl = action.payload.url || '';
                updateSelectedContainerInLocalStorage(action.payload.url);
                break;
            }
        }
    }
);

export const DeeplinkContextProvider: React.FC<IDeeplinkContextProviderProps> = (
    props
) => {
    const { children } = props;

    // skip wrapping if the context already exists
    const existingContext = useDeeplinkContext();
    if (existingContext) {
        return <>{children}</>;
    }

    const { initialState = {} } = props;

    const params = window.location.search;
    const parsed = (queryString.parse(params, {
        decode: true,
        sort: false
    }) as unknown) as IPublicDeeplink;

    // set the initial state for the Deeplink reducer
    // use the URL values and then fallback to initial state that is provided
    const defaultState: IDeeplinkContextState = {
        adtUrl:
            parsed.adtUrl ||
            initialState.adtUrl ||
            getSelectedEnvironmentUrlFromLocalStorage() ||
            '',
        mode: parsed.mode || initialState.mode || ADT3DScenePageModes.ViewScene,
        sceneId: parsed.sceneId || initialState.sceneId || '',
        selectedElementId:
            parseArrayParam(parsed.selectedElementIds)?.[0] ||
            initialState.selectedElementId ||
            '',
        selectedLayerIds:
            parseArrayParam(parsed.selectedLayerIds) ||
            initialState.selectedLayerIds ||
            [],
        storageUrl:
            parsed.storageUrl ||
            initialState.storageUrl ||
            getSelectedContainerUrlFromLocalStorage() ||
            ''
    };

    const [deeplinkState, deeplinkDispatch] = useReducer(
        DeeplinkContextReducer,
        defaultState
    );
    const consumerDeeplinkContext = useConsumerDeeplinkContext();
    const getDeeplinkCallback = useCallback(
        (options: IDeeplinkOptions) => {
            let link = buildDeeplink(deeplinkState, options);
            // if the consumer provides a callback, call them and use the returned value
            if (consumerDeeplinkContext?.onGenerateDeeplink) {
                logDebugConsole(
                    'debug',
                    'Consumer deeplink callback present, passing string to consumer. Initial link:',
                    link
                );
                if (link) {
                    link = consumerDeeplinkContext?.onGenerateDeeplink(
                        link,
                        options
                    );
                }
                logDebugConsole('debug', 'Consumer modified link:', link);
            }
            return link;
        },
        [deeplinkState, consumerDeeplinkContext?.onGenerateDeeplink]
    );

    // notify telemetry service of changes to the adt instance
    useEffect(() => {
        TelemetryService.setAdtInstance(deeplinkState.adtUrl);
    }, [deeplinkState.adtUrl]);
    // notify telemetry service of changes to the blob storage
    useEffect(() => {
        TelemetryService.setStorageContainerUrl(deeplinkState.storageUrl);
    }, [deeplinkState.storageUrl]);
    // notify telemetry service of changes to the scene id
    useEffect(() => {
        TelemetryService.setSceneId(deeplinkState.sceneId);
    }, [deeplinkState.sceneId]);

    return (
        <DeeplinkContext.Provider
            value={{
                deeplinkDispatch,
                deeplinkState,
                getDeeplink: getDeeplinkCallback
            }}
        >
            {children}
        </DeeplinkContext.Provider>
    );
};

const buildDeeplink = (
    currentState: IDeeplinkContextState,
    options: IDeeplinkOptions
): string => {
    if (!currentState) return '';

    // note: the order of properties here is the order of that the QSPs will be in the URL
    const deeplink: IPublicDeeplink = {
        sceneId: currentState.sceneId,
        selectedElementIds: options?.includeSelectedElement
            ? serializeArrayParam([currentState.selectedElementId])
            : undefined,
        selectedLayerIds: options?.includeSelectedLayers
            ? serializeArrayParam(currentState.selectedLayerIds)
            : undefined,
        mode: currentState.mode,
        adtUrl: currentState.adtUrl,
        storageUrl: currentState.storageUrl
    };

    // if we only want the stringified object
    let url = '';
    if (options.excludeBaseUrl) {
        url = queryString.stringify(deeplink, DEEPLINK_SERIALIZATION_OPTIONS);
    } else {
        url = queryString.stringifyUrl(
            { url: location.href, query: { ...deeplink } },
            DEEPLINK_SERIALIZATION_OPTIONS
        );
    }
    logDebugConsole('debug', `Deeplink options: `, options);
    logDebugConsole('debug', `Deeplink properties: `, deeplink);
    logDebugConsole('info', `Full deeplink: `, url);
    return url;
};

const ARRAY_VALUE_SEPARATOR = ',';
/**
 * takes a parameter that should be an array and serializes it for the URL
 * NOTE: we write our own serialization here to avoid the complex parsing logic that comes native since we only need primitives right now
 */
const serializeArrayParam = (values: string[]): string => {
    if (!values?.length) return '';
    return values.join(ARRAY_VALUE_SEPARATOR);
};

/**
 * takes a parameter that should be an array and splits it back out from string to an array
 * NOTE: we write our own serialization here to avoid the complex parsing logic that comes native since we only need primitives right now
 */
const parseArrayParam = (value: string): string[] => {
    if (!value) return undefined;
    return value.split(ARRAY_VALUE_SEPARATOR);
};

// START of local storage handling
/**
 * read the selected environment url from local storage if exists to set the initial value of 'adtUrl' in the initial default state of DeeplinkContext
 */
const getSelectedEnvironmentUrlFromLocalStorage = (): string | null => {
    try {
        const selectedEnvironmentInLocalStorage = localStorage.getItem(
            SelectedEnvironmentLocalStorageKey
        );
        return selectedEnvironmentInLocalStorage
            ? (JSON.parse(
                  selectedEnvironmentInLocalStorage
              ) as ADTSelectedEnvironmentInLocalStorage)?.appAdtUrl
            : null;
    } catch (error) {
        console.error(error.message);
        return null;
    }
};

/**
 * read the selected container url from local storage if exists to set the initial value of 'storageUrl' in the initial default state of DeeplinkContext
 */
const getSelectedContainerUrlFromLocalStorage = (): string | null => {
    return localStorage.getItem(SelectedContainerLocalStorageKey);
};

/**
 * update the selected environment url in local storage along with the update in the state of DeeplinkContext
 */
const updateSelectedEnvironmentInLocalStorage = (
    selectedEnvironmentUrl: string
) => {
    if (selectedEnvironmentUrl) {
        localStorage.setItem(
            SelectedEnvironmentLocalStorageKey,
            JSON.stringify({
                appAdtUrl: selectedEnvironmentUrl
            })
        );
    } else {
        localStorage.removeItem(SelectedEnvironmentLocalStorageKey);
    }
};

/**
 * update the selected container url in local storage along with the update in the state of DeeplinkContext
 */
const updateSelectedContainerInLocalStorage = (selectedContainer: string) => {
    if (selectedContainer) {
        localStorage.setItem(
            SelectedContainerLocalStorageKey,
            selectedContainer
        );
    } else {
        localStorage.removeItem(SelectedContainerLocalStorageKey);
    }
};
// END of local storage handling
