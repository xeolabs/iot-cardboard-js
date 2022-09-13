import {
    IDropdownStyles,
    IIconStyles,
    IStyle,
    IStyleFunctionOrObject,
    ITheme
} from '@fluentui/react';

export interface IColumnPickerProps {
    searchedProperties: string[];
    allAvailableProperties: Set<string>;
    addColumn: (columnName: string) => void;
    deleteColumn: (columnName: string) => void;
    /**
     * Call to provide customized styling that will layer on top of the variant rules.
     */
    styles?: IStyleFunctionOrObject<
        IColumnPickerStyleProps,
        IColumnPickerStyles
    >;
}

export interface IColumnPickerStyleProps {
    theme: ITheme;
}
export interface IColumnPickerStyles {
    root: IStyle;
    dropdownTitle: IStyle;

    /**
     * SubComponent styles.
     */
    subComponentStyles?: IColumnPickerSubComponentStyles;
}

export interface IColumnPickerSubComponentStyles {
    icon?: IIconStyles;
    dropDown?: IDropdownStyles;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IColumnPickerSubComponentStyles {}
