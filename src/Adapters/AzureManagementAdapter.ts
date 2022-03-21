export default class AzureManagementAdapter {
    async getUserRolesByResourceId(resourceId: string) {
        return axios({
            method: 'get',
            url: `https://management.azure.com${resourceId}/providers/Microsoft.Authorization/roleAssignments`,
            headers: {
                'Content-Type': 'application/json',
                authorization: 'Bearer ' + token
            },
            params: {
                'api-version': '2021-04-01-preview',
                $filter: `atScope() and assignedTo('${this.uniqueObjectId}')`
            }
        });
    }

    async getADTInstances(tenantId?: string, uniqueObjectId?: string) {
        const adapterMethodSandbox = new AdapterMethodSandbox(this.authService);
        if (tenantId) {
            this.tenantId = tenantId;
        }
        if (uniqueObjectId) {
            this.uniqueObjectId = uniqueObjectId;
        }

        return await adapterMethodSandbox.safelyFetchData(async (token) => {
            const subscriptions = await axios({
                method: 'get',
                url: `https://management.azure.com/subscriptions`,
                headers: {
                    'Content-Type': 'application/json',
                    authorization: 'Bearer ' + token
                },
                params: {
                    'api-version': '2020-01-01'
                }
            });

            const subscriptionsByTenantId = subscriptions.data.value
                .filter((s) => s.tenantId === this.tenantId)
                .map((s) => s.subscriptionId);

            const digitalTwinInstancesBySubscriptions = await Promise.all(
                subscriptionsByTenantId.map((subscriptionId) => {
                    return axios({
                        method: 'get',
                        url: `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.DigitalTwins/digitalTwinsInstances`,
                        headers: {
                            'Content-Type': 'application/json',
                            authorization: 'Bearer ' + token
                        },
                        params: {
                            'api-version': '2020-12-01'
                        }
                    });
                })
            );

            const digitalTwinsInstanceDictionary = [];
            for (
                let i = 0;
                i < digitalTwinInstancesBySubscriptions.length;
                i++
            ) {
                const instances: any = digitalTwinInstancesBySubscriptions[i];
                if (instances.data.value.length) {
                    let userRoleAssignments;
                    try {
                        userRoleAssignments = await Promise.all(
                            instances.data.value.map((instance) => {
                                return axios({
                                    method: 'get',
                                    url: `https://management.azure.com${instance.id}/providers/Microsoft.Authorization/roleAssignments`,
                                    headers: {
                                        'Content-Type': 'application/json',
                                        authorization: 'Bearer ' + token
                                    },
                                    params: {
                                        'api-version': '2021-04-01-preview',
                                        $filter: `atScope() and assignedTo('${this.uniqueObjectId}')`
                                    }
                                });
                            })
                        );
                        instances.data.value.map((instance, idx) => {
                            const assignedUserRoleIds = userRoleAssignments[
                                idx
                            ]?.data?.value?.map((v) => {
                                return v.properties.roleDefinitionId
                                    .split('/')
                                    .pop();
                            });

                            // return the adt instances only if the user has 'Azure Digital Twins Data Reader' or 'Azure Digital Twins Data Owner' permission assigned for it
                            if (
                                assignedUserRoleIds?.includes(
                                    'd57506d4-4c8d-48b1-8587-93c323f6a5a3'
                                ) ||
                                assignedUserRoleIds?.includes(
                                    'bcd981a7-7f74-457b-83e1-cceb9e632ffe'
                                )
                            ) {
                                digitalTwinsInstanceDictionary.push({
                                    name: instance.name,
                                    hostName: instance.properties.hostName,
                                    resourceId: instance.id,
                                    location: instance.location
                                });
                            }
                        });
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
            return new ADTInstancesData(digitalTwinsInstanceDictionary);
        }, 'azureManagement');
    }
}
