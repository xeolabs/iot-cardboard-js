import axios from 'axios';
import { ADTTwinData } from '../Models/Classes';
import AdapterEntityCache from '../Models/Classes/AdapterEntityCache';
import ADTInstanceConnectionData from '../Models/Classes/AdapterDataClasses/ADTInstanceConnectionData';
import ADTInstancesData from '../Models/Classes/AdapterDataClasses/ADTInstancesData';
import AdapterMethodSandbox from '../Models/Classes/AdapterMethodSandbox';
import AdapterResult from '../Models/Classes/AdapterResult';
import {
    AzureAccessPermissionRoles,
    AzureResourceTypes,
    ComponentErrorType
} from '../Models/Constants/Enums';
import { IAuthService, IAzureResource } from '../Models/Constants/Interfaces';
import { applyMixins } from '../Models/Services/Utils';
import ADTAdapter from './ADTAdapter';
import ADXAdapter from './ADXAdapter';
import AzureManagementAdapter from './AzureManagementAdapter';
import BlobAdapter from './BlobAdapter';
import {
    ADTAllModelsData,
    ADTTwinToModelMappingData
} from '../Models/Classes/AdapterDataClasses/ADTModelData';
import {
    IAzureRoleAssignment,
    instancesRefreshMaxAge,
    AzureAccessPermissionRoleGroups,
    modelRefreshMaxAge,
    RequiredAccessRoleGroupForStorageContainer,
    RequiredAccessRoleGroupForADTInstance
} from '../Models/Constants';
import {
    AzureMissingRoleDefinitionsData,
    AzureResourcesData
} from '../Models/Classes/AdapterDataClasses/AzureManagementData';

export default class ADT3DSceneAdapter {
    constructor(
        authService: IAuthService,
        adtHostUrl: string,
        blobContainerUrl?: string,
        tenantId?: string,
        uniqueObjectId?: string,
        adtProxyServerPath = '/proxy/adt',
        blobProxyServerPath = '/proxy/blob'
    ) {
        this.adtHostUrl = adtHostUrl;
        this.authService = this.blobAuthService = this.adxAuthService = authService;
        this.tenantId = tenantId;
        this.uniqueObjectId = uniqueObjectId;
        this.adtTwinCache = new AdapterEntityCache<ADTTwinData>(9000);
        this.adtModelsCache = new AdapterEntityCache<ADTAllModelsData>(
            modelRefreshMaxAge
        );
        this.adtTwinToModelMappingCache = new AdapterEntityCache<ADTTwinToModelMappingData>(
            modelRefreshMaxAge
        );
        this.adtInstancesCache = new AdapterEntityCache<ADTInstancesData>(
            instancesRefreshMaxAge
        );

        if (blobContainerUrl) {
            try {
                const containerURL = new URL(blobContainerUrl);
                this.storageAccountHostName = containerURL.hostname;
                this.storageAccountName = containerURL.hostname.split('.')[0];
                this.containerName = containerURL.pathname.split('/')[1];
            } catch (error) {
                console.error(error.message);
            }
        }

        this.adtProxyServerPath = adtProxyServerPath;
        this.blobProxyServerPath = blobProxyServerPath;
        this.authService.login();
        // Fetch & cache models on mount (makes first use of models faster as models should already be cached)
        this.getAllAdtModels();
    }
    getConnectionInformation = async () => {
        if (this.clusterUrl && this.databaseName && this.tableName) {
            return new AdapterResult<ADTInstanceConnectionData>({
                result: new ADTInstanceConnectionData({
                    kustoClusterUrl: this.clusterUrl,
                    kustoDatabaseName: this.databaseName,
                    kustoTableName: this.tableName
                }),
                errorInfo: null
            });
        }

        const adapterMethodSandbox = new AdapterMethodSandbox(this.authService);
        return await adapterMethodSandbox.safelyFetchData(async (token) => {
            const digitalTwinInstances = await this.getResourcesByPermissions({
                getResourcesParams: {
                    resourceType: AzureResourceTypes.DigitalTwinInstance
                },
                requiredAccessRoles: RequiredAccessRoleGroupForADTInstance
            });
            const result = digitalTwinInstances.result.data;
            const instance = result.find(
                (d) => d.properties.hostName === this.adtHostUrl
            );

            try {
                // use the below azure management call to get adt-adx connection information including Kusto cluster url, database name and table name to retrieve the data history from
                const connectionsData = await axios({
                    method: 'get',
                    url: `https://management.azure.com${instance.id}/timeSeriesDatabaseConnections`,
                    headers: {
                        Authorization: 'Bearer ' + token,
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    params: {
                        'api-version': '2021-06-30-preview'
                    }
                });
                this.clusterUrl =
                    connectionsData.data.value[0].properties.adxEndpointUri;
                this.databaseName =
                    connectionsData.data.value[0].properties.adxDatabaseName;
                this.tableName = `adt_dh_${connectionsData.data.value[0].properties.adxDatabaseName.replaceAll(
                    '-',
                    '_'
                )}_${instance?.location}`;
            } catch (error) {
                adapterMethodSandbox.pushError({
                    isCatastrophic: false,
                    rawError: error
                });
            }
            return new ADTInstanceConnectionData({
                kustoClusterUrl: this.clusterUrl,
                kustoDatabaseName: this.databaseName,
                kustoTableName: this.tableName
            });
        }, 'azureManagement');
    };

    /** Checking missing role assignments for the container, for this we need the resouce id of the container and we need to make
     * series of Azure Management calls for be able to find that container - if exist in user's subscription.
     */
    getMissingStorageContainerAccessRoles = async (
        containerUrlString?: string
    ) => {
        let storageAccountName, containerName;
        if (containerUrlString) {
            try {
                const containerURL = new URL(containerUrlString);
                this.storageAccountName = containerURL.hostname.split('.')[0];
                this.containerName = containerURL.pathname.split('/')[1];
            } catch (error) {
                storageAccountName = null;
                containerName = null;
                console.error(error);
            }
        } else {
            storageAccountName = this.storageAccountName;
            containerName = this.containerName;
        }

        const adapterMethodSandbox = new AdapterMethodSandbox(this.authService);
        return await adapterMethodSandbox.safelyFetchData(async () => {
            try {
                const storageEndPoint = `${AzureResourceTypes.StorageAccount}/${storageAccountName}/blobServices/default/containers`;
                const storageResourcesInUsersSubscriptionsResult = await this.getResources(
                    {
                        resourceType: AzureResourceTypes.StorageBlobContainer,
                        resourceProviderEndpoint: storageEndPoint
                    }
                );

                const storageResources: Array<IAzureResource> = storageResourcesInUsersSubscriptionsResult?.getData();
                const storageResource = storageResources?.find(
                    (sR) =>
                        storageAccountName ===
                            sR.id.split('/storageAccounts/')[1].split('/')[0] &&
                        sR.name === containerName
                );
                if (storageResource) {
                    this.containerResourceId = storageResource.id;
                    const missingRoles = await this.getMissingRoleDefinitions(
                        storageResource.id,
                        this.uniqueObjectId,
                        RequiredAccessRoleGroupForStorageContainer
                    );

                    return new AzureMissingRoleDefinitionsData(missingRoles);
                } else {
                    // return null as the container is not even in user's subscription
                    return new AzureMissingRoleDefinitionsData({
                        enforced: null,
                        interchangeables: null
                    });
                }
            } catch (error) {
                adapterMethodSandbox.pushError({
                    type: ComponentErrorType.DataFetchFailed,
                    isCatastrophic: false,
                    rawError: error
                });
                return null;
            }
        });
    };

    /** Adding provided role definitions to the user's role assignments for the container resource. This method assumes that
     * containerResourceId is already set in the previous getMissingStorageContainerAccessRoles method and present for assigning roles for.
     */
    addMissingRolesToStorageContainer = async (
        missingRoleDefinitionIds: AzureAccessPermissionRoleGroups
    ) => {
        const adapterMethodSandbox = new AdapterMethodSandbox(this.authService);
        return await adapterMethodSandbox.safelyFetchData(async () => {
            try {
                const enforcedRoleAssignmentResults = await Promise.all(
                    missingRoleDefinitionIds.enforced?.map((roleDefinitionId) =>
                        this.assignRole(
                            roleDefinitionId,
                            this.containerResourceId,
                            this.uniqueObjectId
                        )
                    )
                );

                const interChangeableRoleAssignmentResults = await Promise.all(
                    missingRoleDefinitionIds.interchangeables.map(
                        (interchangeableGroup) => {
                            if (
                                interchangeableGroup.includes(
                                    AzureAccessPermissionRoles[
                                        'Storage Blob Data Contributor'
                                    ]
                                )
                            ) {
                                // add 'Storage Blob Data Contributor' by default if it is in the interchangeable group as minimum
                                return this.assignRole(
                                    AzureAccessPermissionRoles[
                                        'Storage Blob Data Contributor'
                                    ],
                                    this.containerResourceId,
                                    this.uniqueObjectId
                                );
                            } else if (
                                interchangeableGroup.includes(
                                    AzureAccessPermissionRoles['Reader']
                                )
                            ) {
                                // add 'Reader' by default if it is in the interchangeable group as minimum
                                return this.assignRole(
                                    AzureAccessPermissionRoles['Reader'],
                                    this.containerResourceId,
                                    this.uniqueObjectId
                                );
                            } else if (interchangeableGroup.length) {
                                // otherwise add the first item from each interchangeable group
                                return this.assignRole(
                                    interchangeableGroup[0],
                                    this.containerResourceId,
                                    this.uniqueObjectId
                                );
                            }
                        }
                    )
                );

                const newRoleAssignments: Array<IAzureRoleAssignment> = [];

                enforcedRoleAssignmentResults?.forEach((result) => {
                    if (!result?.hasNoData()) {
                        newRoleAssignments.push(result.getData());
                    }
                });

                interChangeableRoleAssignmentResults?.forEach((result) => {
                    if (!result?.hasNoData()) {
                        newRoleAssignments.push(result.getData());
                    }
                });

                return new AzureResourcesData(newRoleAssignments);
            } catch (error) {
                adapterMethodSandbox.pushError({
                    type: ComponentErrorType.DataFetchFailed,
                    isCatastrophic: false,
                    rawError: error
                });
                return null;
            }
        });
    };
}

export default interface ADT3DSceneAdapter
    extends ADTAdapter,
        BlobAdapter,
        AzureManagementAdapter,
        ADXAdapter {
    getConnectionInformation: () => Promise<
        AdapterResult<ADTInstanceConnectionData>
    >;
    getMissingStorageContainerAccessRoles: (
        containerURLString?: string
    ) => Promise<AdapterResult<AzureMissingRoleDefinitionsData>>;
    addMissingRolesToStorageContainer: (
        missingRoleDefinitionIds: AzureAccessPermissionRoleGroups
    ) => Promise<AdapterResult<AzureResourcesData>>;
}
applyMixins(ADT3DSceneAdapter, [
    ADTAdapter,
    BlobAdapter,
    AzureManagementAdapter,
    ADXAdapter
]);
