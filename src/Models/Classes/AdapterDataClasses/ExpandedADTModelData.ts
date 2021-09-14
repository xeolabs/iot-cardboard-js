import { IAdapterData, IDTDLInterface } from '../../Constants/Interfaces';

interface IExpandedADTModelData {
    rootModel: IDTDLInterface;
    expandedModels: IDTDLInterface[];
}

class ExpandedADTModelData implements IAdapterData {
    data: IExpandedADTModelData;

    constructor(data: IExpandedADTModelData) {
        this.data = data;
    }

    hasNoData() {
        return this.data === null || this.data === undefined;
    }
}

export default ExpandedADTModelData;
