import React, { useCallback, useRef, useState } from 'react';
import {
    IQueryBuilderProps,
    IQueryBuilderStyleProps,
    IQueryBuilderStyles,
    QueryRowType
} from './QueryBuilder.types';
import { getStyles } from './QueryBuilder.styles';
import {
    classNamesFunction,
    useTheme,
    styled,
    ActionButton,
    PrimaryButton
} from '@fluentui/react';
import QueryBuilderRow from './QueryBuilderRow';
import { buildQuery } from './QueryBuilderUtils';
import { PropertyValueType } from '../../../ModelledPropertyBuilder/ModelledPropertyBuilder.types';
import { useTranslation } from 'react-i18next';

const getClassNames = classNamesFunction<
    IQueryBuilderStyleProps,
    IQueryBuilderStyles
>();

const QueryBuilder: React.FC<IQueryBuilderProps> = (props) => {
    const {
        adapter,
        allowedPropertyValueTypes,
        executeQuery,
        styles,
        theme,
        updateColumns
    } = props;

    // State
    const querySnippets = useRef(new Map<string, QueryRowType>());
    const validityMap = useRef(new Map<string, boolean>());
    const propertyNames = useRef(new Map<string, string>());
    const [isSearchDisabled, setIsSearchDisabled] = useState(true);
    const [rows, updateRows] = useState<any[]>([
        {
            rowId: String(Math.random())
        }
    ]);

    // Hooks
    const { t } = useTranslation();

    // Classname after state to track row #
    const classNames = getClassNames(styles, {
        theme: useTheme(),
        rowCount: rows.length
    });

    // Callbacks
    const removeRow = useCallback(
        (index: number, rowId: string) => {
            // Remove row component
            const newRows = [...rows];
            if (index === 0) {
                newRows.shift();
            } else {
                newRows.splice(index, 1);
            }
            updateRows(newRows);
            // Remove row values in query and property
            querySnippets.current.delete(rowId);
            propertyNames.current.delete(rowId);
            validityMap.current.delete(rowId);
            // Reset validity
            setIsSearchDisabled(!checkIsValidQuery());
        },
        [rows]
    );

    const onChangeValue = useCallback((rowId: string, newValue: string) => {
        // Reset validity on value change
        if (newValue.length) {
            validityMap.current.set(rowId, true);
        } else {
            validityMap.current.set(rowId, false);
        }
        setIsSearchDisabled(!checkIsValidQuery());
    }, []);

    const updateQuerySnippet = (rowId: string, rowValue: QueryRowType) => {
        querySnippets.current.set(rowId, rowValue);
    };

    const onChangeProperty = useCallback(
        (
            rowId: string,
            propertyName: string,
            propertyType: PropertyValueType
        ) => {
            // Either create new property entry or modify existing one
            propertyNames.current.set(rowId, propertyName);
            const propertyNameArray = propertyNames.current.values();
            // Then send to parent component
            updateColumns(new Set<string>(propertyNameArray));
            // Reset validity and update snippet, string is the only field with no default value and blank is not a valid input
            if (propertyType !== 'string') {
                validityMap.current.set(rowId, true);
            } else {
                validityMap.current.set(rowId, false);
            }
            setIsSearchDisabled(!checkIsValidQuery());
        },
        [updateColumns]
    );

    const appendRow = useCallback(() => {
        // Add row component
        const rowId = String(Math.random());
        const newRows = [
            ...rows,
            {
                rowId: rowId
            }
        ];
        updateRows(newRows);
        // Set validity to false since row is just initialized
        validityMap.current.set(rowId, false);
        setIsSearchDisabled(!checkIsValidQuery());
    }, [rows]);

    const onSearch = useCallback(() => {
        const query = buildQuery(Array.from(querySnippets.current.values()));
        executeQuery(query);
    }, [executeQuery]);

    // Non-useCallback functions
    const checkIsValidQuery = () => {
        if (validityMap.current.size === 0) {
            return true;
        }
        let isValid = true;
        validityMap.current.forEach((validity: boolean) => {
            if (!validity) {
                isValid = false;
            }
        });
        return isValid;
    };

    return (
        <div className={classNames.root}>
            <div className={classNames.headerGrid}>
                {!(rows.length === 1) && (
                    <p className={classNames.headerText}>
                        {t('advancedSearch.andOr')}
                    </p>
                )}
                <p className={classNames.headerText}>
                    {t('advancedSearch.property')}
                </p>
                <p className={classNames.headerText}>
                    {t('advancedSearch.operator')}
                </p>
                <p className={classNames.headerText}>
                    {t('advancedSearch.value')}
                </p>
            </div>
            <div className={classNames.rowContainer}>
                {rows.map((row, index) => (
                    <QueryBuilderRow
                        adapter={adapter}
                        allowedPropertyValueTypes={allowedPropertyValueTypes}
                        key={row.rowId}
                        position={index}
                        removeRow={removeRow}
                        rowId={row.rowId}
                        onChangeValue={onChangeValue}
                        onChangeProperty={onChangeProperty}
                        updateSnippet={updateQuerySnippet}
                        isRemoveDisabled={rows.length === 1}
                        styles={classNames.subComponentStyles.row}
                        theme={theme}
                    />
                ))}
            </div>
            <ActionButton
                onClick={appendRow}
                text={t('advancedSearch.addNewRow')}
                styles={classNames.subComponentStyles.addButton()}
                disabled={rows.length === 10}
            />
            <PrimaryButton
                text={t('search')}
                onClick={onSearch}
                disabled={isSearchDisabled}
                styles={classNames.subComponentStyles.searchButton()}
            />
        </div>
    );
};

export default styled<
    IQueryBuilderProps,
    IQueryBuilderStyleProps,
    IQueryBuilderStyles
>(QueryBuilder, getStyles);
