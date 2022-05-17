import React, { useState } from 'react';
import { GlobeTheme } from '../../Models/Constants';
import { getDefaultStoryDecorator } from '../../Models/Services/StoryUtilities';
import GlobeStylePicker from './GlobeStylePicker';

const wrapperStyle = { width: 'auto', height: '500px', padding: '12px' };

export default {
    title: 'Components/GlobeStylePicker',
    component: GlobeStylePicker,
    decorators: [getDefaultStoryDecorator(wrapperStyle)]
};

export const Picker = () => {
    const [globeStyle, setGlobeStyle] = useState<GlobeTheme>(null);
    return (
        <div style={wrapperStyle}>
            <div style={{ marginBottom: '30px' }}>
                <div>
                    <span>Style: </span>
                    <span>{globeStyle}</span>
                </div>
            </div>
            <GlobeStylePicker globeStyleUpdated={(gs) => setGlobeStyle(gs)} />
        </div>
    );
};
