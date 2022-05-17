import {
    ChoiceGroup,
    FocusTrapCallout,
    FontIcon,
    IChoiceGroupOption,
    IconButton,
    memoizeFunction,
    mergeStyleSets,
    Theme,
    useTheme
} from '@fluentui/react';
import { useBoolean } from '@fluentui/react-hooks';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeTheme } from '../../Models/Constants';
import DefaultStyle from '../../Resources/Static/default.svg';
import HeaderControlButton from '../HeaderControlButton/HeaderControlButton';
import HeaderControlGroup from '../HeaderControlGroup/HeaderControlGroup';

interface GlobeStylePickerProps {
    defaultGlobeStyle?: GlobeTheme;
    globeStyleUpdated: (globeStyle: GlobeTheme) => void;
}

const GlobeStylePicker: React.FC<GlobeStylePickerProps> = ({
    defaultGlobeStyle,
    globeStyleUpdated
}) => {
    const [showPicker, { toggle: togglePicker }] = useBoolean(false);
    const [globeStyle, setGlobeStyle] = useState<GlobeTheme>(null);
    const calloutAnchor = 'cb-theme-callout-anchor';
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = getStyles(theme);

    const options: IChoiceGroupOption[] = useMemo(
        () => [
            {
                key: GlobeTheme.Blue,
                imageSrc: DefaultStyle,
                imageAlt: t('globeStylePicker.blue'),
                selectedImageSrc: DefaultStyle,
                imageSize: { width: 40, height: 40 },
                text: t('globeStylePicker.blue'),
                styles: {
                    innerField: {
                        width: 100,
                        padding: 0,
                        justifyContent: 'center'
                    }
                }
            },
            {
                key: GlobeTheme.Grey,
                imageSrc: DefaultStyle,
                imageAlt: t('globeStylePicker.grey'),
                selectedImageSrc: DefaultStyle,
                imageSize: { width: 40, height: 40 },
                text: t('globeStylePicker.grey'),
                styles: {
                    innerField: {
                        width: 100,
                        padding: 0,
                        justifyContent: 'center'
                    }
                }
            },
            {
                key: GlobeTheme.Yellow,
                imageSrc: DefaultStyle,
                imageAlt: t('globeStylePicker.yellow'),
                selectedImageSrc: DefaultStyle,
                imageSize: { width: 40, height: 40 },
                text: t('globeStylePicker.yellow'),
                styles: {
                    innerField: {
                        width: 100,
                        padding: 0,
                        justifyContent: 'center'
                    }
                }
            }
        ],
        [t]
    );

    useEffect(() => {
        setGlobeStyle(GlobeTheme.Blue);
    }, []);

    useEffect(() => {
        if (defaultGlobeStyle) {
            setGlobeStyle(defaultGlobeStyle);
        }
    }, [defaultGlobeStyle]);

    const updateStyle = (style: GlobeTheme) => {
        setGlobeStyle(style);
        if (globeStyleUpdated) {
            globeStyleUpdated(style);
        }
    };

    return (
        <div>
            <HeaderControlGroup>
                <HeaderControlButton
                    iconProps={{ iconName: 'Color' }}
                    id={calloutAnchor}
                    onClick={togglePicker}
                    title={t('modelViewerModePicker.buttonLabel')}
                    isActive={showPicker}
                />
            </HeaderControlGroup>
            {showPicker && (
                <FocusTrapCallout
                    focusTrapProps={{
                        isClickableOutsideFocusTrap: true
                    }}
                    target={`#${calloutAnchor}`}
                    onDismiss={togglePicker}
                    backgroundColor={theme.semanticColors.bodyBackground}
                >
                    <div className={styles.calloutContent}>
                        <div className={styles.header}>
                            <div>
                                <FontIcon iconName="globe" />
                            </div>
                            <div className={styles.title}>
                                {t('globeStylePicker.title')}
                            </div>
                            <div>
                                <IconButton
                                    iconProps={{
                                        iconName: 'Cancel',
                                        style: {
                                            fontSize: '14',
                                            height: '32'
                                        }
                                    }}
                                    onClick={togglePicker}
                                />
                            </div>
                        </div>
                        <ChoiceGroup
                            defaultSelectedKey={globeStyle}
                            options={options}
                            onChange={(e, option) =>
                                updateStyle(option.key as GlobeTheme)
                            }
                        />
                    </div>
                </FocusTrapCallout>
            )}
        </div>
    );
};

const getStyles = memoizeFunction((_theme: Theme) => {
    return mergeStyleSets({
        calloutContent: {
            padding: '12px'
        },
        header: {
            display: 'flex',
            lineHeight: '32px',
            verticalAlign: 'middle',
            fontSize: '16'
        },
        title: {
            marginLeft: '12px',
            fontWeight: '500',
            flex: '1'
        },
        subHeading: {
            fontSize: '12',
            fontWeight: '500',
            marginTop: '12px',
            marginBottom: '12px'
        }
    });
});

export default GlobeStylePicker;
