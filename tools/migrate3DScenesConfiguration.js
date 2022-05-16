require('colors');
const fs = require('fs');
const crypto = require('crypto');

// START: Utility methods for converting behavior objects
const convertStatusColoring = (oldVisual) => {
    console.log('Converting status visual'.green);
    const newVisual = {};
    newVisual.type = 'ExpressionRangeVisual';
    newVisual.expressionType = 'NumericRange';
    newVisual.valueExpression = oldVisual.statusValueExpression;
    newVisual.valueRanges = [];
    oldVisual.valueRanges.forEach((vr) => {
        newVisual.valueRanges.push({
            values: [vr.min, vr.max],
            visual: {
                color: vr.color
            },
            id: vr.id
        });
    });
    newVisual.objectIDs = {
        expression: oldVisual.objectIDs.expression
    };
    return newVisual;
};

const convertAlert = (oldVisual) => {
    console.log('Converting alert visual'.green);
    const newVisual = {};
    newVisual.type = 'ExpressionRangeVisual';
    newVisual.expressionType = 'CategoricalValues';
    newVisual.valueExpression = oldVisual.triggerExpression;
    newVisual.valueRanges = [];
    newVisual.valueRanges.push({
        values: [true],
        visual: {
            color: oldVisual.color,
            labelExpression: '`' + oldVisual.labelExpression + '`'
        },
        id: crypto.randomBytes(16).toString('hex')
    });
    newVisual.objectIDs = {
        expression: oldVisual.objectIDs.expression
    };
    return newVisual;
};

const convertGauge = (oldGauge) => {
    console.log('Converting gauge'.green);
    const newGauge = {};
    newGauge.id = oldGauge.id;
    newGauge.type = 'Gauge';
    newGauge.valueExpression = oldGauge.valueExpression;
    newGauge.widgetConfiguration = {};
    newGauge.widgetConfiguration.label = oldGauge.widgetConfiguration.label;
    newGauge.widgetConfiguration.valueRanges = [];
    oldGauge.widgetConfiguration.valueRanges.forEach((oldVr) => {
        newGauge.widgetConfiguration.valueRanges.push({
            values: [oldVr.min, oldVr.max],
            visual: {
                color: oldVr.color
            },
            id: oldVr.id
        });
    });
    newGauge.widgetConfiguration.units = oldGauge.widgetConfiguration.units;
    return newGauge;
};
// END: Utility methods for converting behavior objects

// START: Read and convert file
const filePath = process.argv[2];

if (!filePath) {
    console.error(
        'Please enter valid 3DScenesConfiguration absolute file path'.red
    );
    process.exit(1);
}

console.log(`Reading file ${filePath}`.green);

var configFileObject;
try {
    var configFileText = fs
        .readFileSync(filePath, 'utf8')
        .replace(/^\uFEFF/, '');
    console.log(
        'File successfully read, replacing instances of LinkedTwin with PrimaryTwin'
            .green
    );
    var lowerCaseReplace = new RegExp('linkedTwin', 'g');
    var upperCaseReplace = new RegExp('LinkedTwin', 'g');
    configFileText = configFileText.replace(lowerCaseReplace, 'primaryTwin');
    configFileText = configFileText.replace(upperCaseReplace, 'PrimaryTwin');
    console.log('Successfully replaced LinkedTwin with Primary Twin'.green);
    console.log('Parsing to object to migrate behaviors'.green);
    configFileObject = JSON.parse(configFileText);
} catch (err) {
    console.error(err);
}

console.log('Migrating behaviors...'.green);
configFileObject.configuration.behaviors.forEach((behavior) => {
    behavior.visuals = behavior.visuals.map((visual) => {
        if (visual.type == 'StatusColoring')
            return convertStatusColoring(visual);
        else if (visual.type == 'Alert') return convertAlert(visual);
        else if (visual.type == 'Popover') {
            visual.widgets = visual.widgets.map((widget) => {
                if (widget.type == 'Gauge') {
                    return convertGauge(widget);
                }
                return widget;
            });
        }
        return visual;
    });
});

console.log('Successfully migrated behaviors, writing migrated file...'.green);
fs.writeFileSync(
    '3DScenesConfiguration.migrated.json',
    JSON.stringify(configFileObject)
);
console.log('Successfully wrote 3DScenesConfiguration.migrated.json'.yellow);
console.log('File migration successful, enjoy!'.green);
// END: Read and convert file
