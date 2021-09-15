import {
    ADTModelData,
    ADTRelationshipsData,
    ADTRelationshipData,
    ADTTwinData,
    KeyValuePairAdapterData,
    SearchSpan,
    TsiClientAdapterData
} from '../Classes';
import {
    ADTAdapterModelsData,
    ADTAdapterPatchData,
    ADTAdapterTwinsData
} from '../Classes/AdapterDataClasses/ADTAdapterData';
import {
    StandardModelData,
    StandardModelIndexData,
    StandardModelSearchData
} from '../Classes/AdapterDataClasses/StandardModelData';
import ADTTwinLookupData from '../Classes/AdapterDataClasses/ADTTwinLookupData';
import AdapterResult from '../Classes/AdapterResult';
import {
    CardErrorType,
    Locale,
    Theme,
    HierarchyNodeType,
    modelActionType
} from './Enums';
import {
    AdapterReturnType,
    AdapterMethodParams,
    AdapterMethodParamsForGetADTModels,
    AdapterMethodParamsForGetADTTwinsByModelId,
    AdapterMethodParamsForSearchADTTwins
} from './Types';
import {
    ADTModel_ImgPropertyPositions_PropertyName,
    ADTModel_ImgSrc_PropertyName
} from './Constants';
import ExpandedADTModelData from '../Classes/AdapterDataClasses/ExpandedADTModelData';

export interface IAction {
    type: string;
    payload?: any;
}

export interface IAuthService {
    login: () => void;
    getToken: () => Promise<string>;
}

export interface IEnvironmentToConstantMapping {
    authority: string;
    clientId: string;
    scope: string;
    redirectUri: string;
}

export interface IAdapterData {
    data: any;
    hasNoData?: () => boolean;
}

export interface IUseAdapter<T extends IAdapterData> {
    /** Adapter loading state */
    isLoading: boolean;

    /** Result of adapter method call */
    adapterResult: AdapterResult<T>;

    /** Calls adapter method (safe on unmount) and updates adapter result */
    callAdapter: (params?: AdapterMethodParams) => void;

    /** Cancel adapter method and set the adapter result to null if not explicityly prevented using shouldPreserveResult parameter */
    cancelAdapter: (shouldPreserveResult?: boolean) => void;

    /** Toggles on/off long poll */
    setIsLongPolling: (isLongPolling: boolean) => void;

    /** Indicates long polling state */
    isLongPolling: boolean;

    /** Long polling pulse state for UI */
    pulse: boolean;
}

export interface ICardError {
    /** Name of the error to be used as title */
    name?: string;

    /** Text description of the error */
    message?: string;

    /** Classification of error type */
    type?: CardErrorType;

    /** Catastrophic errors stop adapter execution */
    isCatastrophic?: boolean;

    /** Raw error object from catch block */
    rawError?: Error;

    /** Values that can be used in string interpolation when constructing the error message */
    messageParams?: { [key: string]: string };
}

export interface IErrorInfo {
    errors: ICardError[];
    catastrophicError: ICardError;
}

// Beginning of DTDL based interfaces
export interface IDTDLInterface {
    '@id': string;
    '@type': string;
    '@context': string | string[];
    comment?: string;
    contents?: IDTDLInterfaceContent[];
    description?: string;
    displayName?: string;
    extends?: string | string[];
    schemas?: IDTDLInterfaceSchema[];
}

export interface IDTDLInterfaceSchema {
    '@id': string;
    '@type': 'Array' | 'String' | 'Map' | 'Object';
    comment?: string;
    description?: string;
    displayName?: string;
    [schemaProperty: string]: any;
}

export interface IDTDLInterfaceContent {
    '@type':
        | 'Property'
        | 'Relationship'
        | 'Telemetry'
        | 'Command'
        | 'Component'
        | string[];
    name: string;
    comment?: string;
    description?: string;
    displayName?: string;
    writable?: boolean;
    schema?: string | Record<string, any>;
    [propertyName: string]: any;
}

export interface IDTDLRelationship {
    '@type': 'Relationship';
    name: string;
    '@id'?: string;
    comment?: string;
    description?: string;
    displayName?: string;
    maxMultiplicity?: number;
    minMultiplicity?: number;
    properties?: IDTDLProperty[];
    target?: string;
    writable?: boolean;
}

export interface IDTDLProperty {
    '@type': 'Property' | string[];
    name: string;
    schema?: string | Record<string, any>;
    '@id'?: string;
    comment?: string;
    description?: string;
    displayName?: string;
    unit?: string;
    writable?: boolean;
}
// End of DTDL based interfaces

// Beginning of ADT API response related interfaces
export interface IADTModel {
    id: string;
    description: any;
    displayName: Record<string, string>;
    decommissioned: boolean;
    uploadTime: string;
    model?: IDTDLInterface;
}
export interface IADTTwin {
    $dtId: string;
    $metadata: {
        $model: string;
        [propertyName: string]: any;
    };
    [propertyName: string]: any;
}

export interface IADTRelationship {
    $etag: string;
    $relationshipId: string;
    $relationshipName: string;
    $sourceId: string;
    $targetId: string;
    targetModel?: string;
    [property: string]: any;
}

export interface IADTTwinComponent {
    $metadata: {
        [propertyName: string]: {
            lastUpdateTime: string;
        };
    };
    [propertyName: string]: any; // this can be another component
}
// End of ADT API response related interfaces

export interface IGetKeyValuePairsAdditionalParameters
    extends Record<string, any> {
    isTimestampIncluded?: boolean;
}

export interface IResolvedRelationshipClickErrors {
    twinErrors?: any;
    modelErrors?: any;
}

export interface IViewData {
    viewDefinition: string;
    imageSrc: string;
    imagePropertyPositions: string;
}

export interface IEntityInfo {
    id: string;
    properties: any;
    chartDataOptions?: any;
    [key: string]: any;
}

export interface ICancellablePromise<T> extends Promise<T> {
    cancel: () => void;
}

// Beginning of interfaces for adapters
export interface IMockAdapter {
    /** If unset, random data is generated, if explicitly set, MockAdapter will use value for mocked data.
     *  To mock empty data, explicitly set { mockData: null }
     */
    mockData?: any;

    /** Mocked network timeout period, defaults to 0ms */
    networkTimeoutMillis?: number;

    /** If set, MockAdapter will mock error of set type */
    mockError?: CardErrorType;

    /** Toggles seeding of random data (data remains constants between builds), defaults to true */
    isDataStatic?: boolean;
}

export interface IKeyValuePairAdapter {
    getKeyValuePairs(
        id: string,
        properties: readonly string[],
        additionalParameters?: IGetKeyValuePairsAdditionalParameters
    ): AdapterReturnType<KeyValuePairAdapterData>;
}

export interface ITsiClientChartDataAdapter {
    getTsiclientChartDataShape(
        id: string,
        searchSpan: SearchSpan,
        properties: readonly string[],
        additionalParameters?: Record<string, any>
    ): AdapterReturnType<TsiClientAdapterData>;
}

export interface IADTAdapter extends IKeyValuePairAdapter {
    getADTModels(
        params?: AdapterMethodParamsForGetADTModels
    ): AdapterReturnType<ADTAdapterModelsData>;
    getADTTwinsByModelId(
        params: AdapterMethodParamsForGetADTTwinsByModelId
    ): AdapterReturnType<ADTAdapterTwinsData>;
    searchADTTwins(
        params: AdapterMethodParamsForSearchADTTwins
    ): AdapterReturnType<ADTAdapterTwinsData>;
    getRelationships(id: string): Promise<AdapterResult<ADTRelationshipsData>>;
    getADTTwin(twinId: string): Promise<AdapterResult<ADTTwinData>>;
    getADTModel(modelId: string): Promise<AdapterResult<ADTModelData>>;
    lookupADTTwin?(twinId: string): Promise<ADTTwinLookupData>;
    getADTRelationship(
        twinId: string,
        relationshipId: string
    ): AdapterReturnType<ADTRelationshipData>;
    createADTModels(
        models: IDTDLInterface[]
    ): AdapterReturnType<ADTAdapterModelsData>;
    deleteADTModel(id: string): AdapterReturnType<ADTModelData>;
    createModels(models: IDTDLInterface[]): any;
    createTwins(twins: IADTTwin[], onUploadProgress?): any;
    createRelationships(
        relationships: IADTTwinRelationshipAsset[],
        onUploadProgress?
    ): any;
    getExpandedAdtModel(
        modelId: string,
        baseModelIds?: string[]
    ): AdapterReturnType<ExpandedADTModelData>;
    updateTwin(
        twinId: string,
        patches: Array<ADTPatch>
    ): AdapterReturnType<ADTAdapterPatchData>;
    updateRelationship(
        twinId: string,
        relationshipId: string,
        patches: Array<ADTPatch>
    ): AdapterReturnType<ADTAdapterPatchData>;
}

export interface IBaseStandardModelSearchAdapter {
    CdnUrl: string;
    getModelSearchIndex(): AdapterReturnType<StandardModelIndexData>;
    fetchModelJsonFromCDN(
        dtmi: string,
        actionType: modelActionType
    ): AdapterReturnType<StandardModelData>;
}

export interface IStandardModelSearchAdapter
    extends IBaseStandardModelSearchAdapter {
    githubRepo?: string;
    searchString(
        params: IModelSearchStringParams
    ): AdapterReturnType<StandardModelSearchData>;
}
// End of interfaces for adapters

export interface IModelSearchStringParams {
    queryString: string;
    pageIdx?: number;
    modelIndex: Record<string, any>;
}

export interface IStandardModelSearchItem {
    dtmi: string;
    displayName?: string;
    description?: string;
}

export interface IStandardModelSearchResult {
    data: IStandardModelSearchItem[];
    metadata?: { [key: string]: any };
}

export interface IStandardModelIndexData {
    modelSearchStringIndex: string[];
    modelSearchIndexObj: Record<string, any>;
}

export interface DTwinUpdateEvent {
    dtId: string;
    patchJSON: ADTPatch[];
}

export interface ADTPatch {
    op: 'add' | 'replace' | 'remove';
    path: string; // property path e.g. /property1
    value?: any;
}

export interface SimulationParams {
    daysToSimulate: number;
    dataSpacing: number;
    liveStreamFrequency: number;
    quickStreamFrequency: number;
    isLiveDataSimulated: boolean;
}

export type IADTModelImages = {
    [modelId: string]: IADTModelImageContent;
};

export interface IADTModelImageContent {
    [ADTModel_ImgSrc_PropertyName]: string;
    [ADTModel_ImgPropertyPositions_PropertyName]: Record<string, any>;
}

export interface AssetRelationship {
    name: string;
    target?: string;
    targetModel?: string;
}

export interface AssetTwin {
    name: string;
    assetRelationships?: Array<AssetRelationship>;
}

// used as an intermediary interface for relationship asset for data pusher
export interface IADTTwinRelationshipAsset {
    $relId: string;
    $dtId: string;
    $targetId: string;
    $name: string;
    targetModel?: string;
}

export interface IAdtPusherSimulation {
    seedTimeMillis: number;
    tick(): Array<any>;
    generateDTModels(
        isImagesIncluded?: boolean,
        download?: boolean
    ): Array<IDTDLInterface>;
    generateDTwins(
        isImagesIncluded?: boolean,
        download?: boolean
    ): Array<IADTTwin>;
    generateTwinRelationships(): Array<IADTTwinRelationshipAsset>;
}

// Beginning of interfaces for component props
export interface IBIMViewerProps {
    bimFilePath: string;
    metadataFilePath: string;
    centeredObject?: string;
}

export interface ITSIChartComponentProps {
    data: any[];
    chartOptions?: any;
    chartDataOptions?: any[];
}

export interface ICardBaseProps {
    title?: string;
    theme?: Theme;
    locale?: Locale;
    localeStrings?: Record<string, any>;
    adapterAdditionalParameters?: Record<string, any>;
}
export interface IStandaloneConsumeCardProps extends ICardBaseProps {
    adapter: any;
}

export interface IConsumeCardProps extends ICardBaseProps {
    adapter: any;
    id: string;
    properties: readonly string[];
}

export interface IErrorComponentProps {
    errorTitle: string;
    errorContent?: string;
}

export interface IOverlayProps {
    children: React.ReactNode;
    onClose?: () => void;
}

export interface IConsumeCompositeCardProps extends ICardBaseProps {
    adapter?: any;
}

export interface IHierarchyProps {
    data: Record<string, IHierarchyNode>;
    searchTermToMark?: string;
    isLoading?: boolean;
    onParentNodeClick?: (node: IHierarchyNode) => void;
    onChildNodeClick?: (
        parentNode: IHierarchyNode,
        childNode: IHierarchyNode
    ) => void;
    noDataText?: string;
    shouldScrollToSelectedNode?: boolean;
}

export interface IHierarchyNode {
    name: string;
    id: string;
    parentNode?: IHierarchyNode;
    nodeData: any; // original object from adapter result data
    nodeType: HierarchyNodeType;
    children?: Record<string, IHierarchyNode>;
    childrenContinuationToken?: string | null;
    onNodeClick?: (node?: IHierarchyNode) => void;
    isCollapsed?: boolean;
    isSelected?: boolean;
    isLoading?: boolean;
}

export interface IGenerateADTAssetsProps {
    adapter: IADTAdapter;
    models: readonly IDTDLInterface[];
    twins: readonly IADTTwin[];
    relationships: readonly IADTTwinRelationshipAsset[];
    triggerUpload: boolean;
    onComplete(models, twins, relationships): void;
}
export interface IStepperWizardStep {
    label: string;
    onClick?: () => void;
}

export interface IStepperWizardProps {
    steps: Array<IStepperWizardStep>;
    currentStepIndex?: number;
}

export interface ISearchboxProps {
    className?: string;
    placeholder: string;
    onChange?: (
        event?: React.ChangeEvent<HTMLInputElement>,
        newValue?: string
    ) => void;
    onSearch?: (value: string) => void;
    onClear?: () => void;
}
// End of interfaces for component props
