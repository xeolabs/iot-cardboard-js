import {
    DTwin,
    ADTPatch,
    IADTRelationship,
    PropertyInspectorPatchMode,
    IDTDLInterface,
    IDTDLRelationship
} from '../..';

export interface OnCommitPatchParams {
    patchMode: PropertyInspectorPatchMode;
    id: string;
    sourceTwinId?: string;
    patches: Array<ADTPatch>;
}

export interface StandalonePropertyInspectorProps {
    inputData: TwinParams | RelationshipParams;
    onCommitChanges?: (patchData: OnCommitPatchParams) => any;
    readonly?: boolean;
}

export type TwinParams = {
    twin: DTwin;
    expandedModels: IDTDLInterface[];
    rootModel: IDTDLInterface;
};

export type RelationshipParams = {
    relationship: IADTRelationship;
    relationshipDefinition: IDTDLRelationship;
};

export const isTwin = (
    inputData: TwinParams | RelationshipParams
): inputData is TwinParams => {
    return (inputData as TwinParams).twin !== undefined;
};
