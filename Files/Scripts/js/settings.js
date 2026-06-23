
if (!localStorage.getItem('MZISettings')) localStorage.setItem('MZISettings', '30;7;40;0;0.2;0;220;70;0;120;30;0.6;false;true;false;false;true');

const filamentThickness = 1.75; //Thickness of the raw TPU's filament in milimeters
const moveSpeed = 9000;

let radius;
let angle;
let curveLength;
let middleSpacing;
let nozzleHeight;
let nozzleHop;
let K;

const settings = document.querySelector('#settings');

function createDiv(parent, className) {
    const element = document.createElement('div');

    element.className = className;

    parent.appendChild(element);

    return element;
}
function createSlider(parent, className, min, max, step, index) {
    const element = document.createElement('input');

    element.className = className;
    element.type = 'range';
    element.min = min;
    element.max = max;
    element.step = step;
    element.value = localStorage.getItem('MZISettings').split(';')[index];

    parent.appendChild(element);

    return element;
}
function createCheckingBox(parent, className, index) {
    const element = document.createElement('input');

    element.className = className;
    element.type = 'checkbox'
    element.checked = localStorage.getItem('MZISettings').split(';')[index] == 'true';

    parent.appendChild(element);

    return element;
}

const column1 = createDiv(settings, 'settingsColumn');
const column2 = createDiv(settings, 'settingsColumn');
const column3 = createDiv(settings, 'settingsColumn');
const column4 = createDiv(settings, 'settingsColumn');


// ________________________________________ Curvature Radius ________________________________________
const curvatureRadiusBox = createDiv(column1, 'settingsBox');
const curvatureRadiusHeader = createDiv(curvatureRadiusBox, 'settingsHeader');
const curvatureRadiusSlider = createSlider(curvatureRadiusBox, 'settingsSlider', 0, 50, 1, 0);

curvatureRadiusHeader.textContent = `Curvature Radius : ${curvatureRadiusSlider.value} mm`;

curvatureRadiusSlider.addEventListener('input', updateValues);

// ________________________________________ Straight Guides Length ________________________________________
const straightGuidesLengthBox = createDiv(column1, 'settingsBox');
const straightGuidesLengthHeader = createDiv(straightGuidesLengthBox, 'settingsHeader');
const straightGuidesLengthSlider = createSlider(straightGuidesLengthBox, 'settingsSlider', 2, 20, 1, 1);

straightGuidesLengthHeader.textContent = `Straight Guides Length : ${straightGuidesLengthSlider.value} mm`;

straightGuidesLengthSlider.addEventListener('input', () => {
    straightGuidesLengthHeader.textContent = `Straight Guides Length : ${straightGuidesLengthSlider.value} mm`;

    updateValues();
});

// ________________________________________ Curved Guides Length ________________________________________
const curvedGuidesLengthBox = createDiv(column1, 'settingsBox');
const curvedGuidesLengthHeader = createDiv(curvedGuidesLengthBox, 'settingsHeader');
const curvedGuidesLengthSlider = createSlider(curvedGuidesLengthBox, 'settingsSlider', 10, 70, 1, 2);

curvedGuidesLengthHeader.textContent = `Curved Guides Length : ${curvedGuidesLengthSlider.value} mm`;

curvedGuidesLengthSlider.addEventListener('input', () => {
    curvedGuidesLengthHeader.textContent = `Curved Guides Length : ${curvedGuidesLengthSlider.value} mm`;

    updateValues();
});

// ________________________________________ Central Spacing ________________________________________
const centralSpacingBox = createDiv(column1, 'settingsBox');
const centralSpacingHeader = createDiv(centralSpacingBox, 'settingsHeader');
const centralSpacingSlider = createSlider(centralSpacingBox, 'settingsSlider', 0, 100, 1, 3);

centralSpacingHeader.textContent = `Central Spacing : ${centralSpacingSlider.value} mm`;

centralSpacingSlider.addEventListener('input', updateValues);

// ________________________________________ Extrusion Thickness ________________________________________
const extrusionThicknessBox = createDiv(column2, 'settingsBox');
const extrusionThicknessHeader = createDiv(extrusionThicknessBox, 'settingsHeader');
const extrusionThicknessSlider = createSlider(extrusionThicknessBox, 'settingsSlider', 0.01, 1, 0.01, 4);

extrusionThicknessHeader.textContent = `Extrusion Thickness : ${extrusionThicknessSlider.value} mm`;

extrusionThicknessSlider.addEventListener('input', () => {
    extrusionThicknessHeader.textContent = `Extrusion Thickness : ${extrusionThicknessSlider.value} mm`;

    updateValues();
});

// ________________________________________ Arms Spacing ________________________________________
const armsSpacingBox = createDiv(column2, 'settingsBox');
const armsSpacingHeader = createDiv(armsSpacingBox, 'settingsHeader');
const armsSpacingSlider = createSlider(armsSpacingBox, 'settingsSlider', 0, 1, 0.01, 5);

armsSpacingHeader.textContent = `Arms Spacing : ${armsSpacingSlider.value} mm`;

armsSpacingSlider.addEventListener('input', updateValues);

const armsSpacingMask = createDiv(armsSpacingBox, 'settingsMask');

// ________________________________________ Nozzle Temperature ________________________________________
const nozzleTemperatureBox = createDiv(column2, 'settingsBox');
const nozzleTemperatureHeader = createDiv(nozzleTemperatureBox, 'settingsHeader');
const nozzleTemperatureSlider = createSlider(nozzleTemperatureBox, 'settingsSlider', 200, 240, 1, 6);

nozzleTemperatureHeader.textContent = `Nozzle Temperature : ${nozzleTemperatureSlider.value}°C`;

nozzleTemperatureSlider.addEventListener('input', () => {
    nozzleTemperatureHeader.textContent = `Nozzle Temperature : ${nozzleTemperatureSlider.value}°C`;

    updateValues();
});

// ________________________________________ Bed Temperature ________________________________________
const bedTemperatureBox = createDiv(column2, 'settingsBox');
const bedTemperatureHeader = createDiv(bedTemperatureBox, 'settingsHeader');
const bedTemperatureSlider = createSlider(bedTemperatureBox, 'settingsSlider', 50, 90, 1, 7);

bedTemperatureHeader.textContent = `Bed Temperature : ${bedTemperatureSlider.value}°C`;

bedTemperatureSlider.addEventListener('input', () => {
    bedTemperatureHeader.textContent = `Bed Temperature : ${bedTemperatureSlider.value}°C`;

    updateValues();
});

// ________________________________________ Substrate Thickness ________________________________________
const substrateThicknessBox = createDiv(column3, 'settingsBox');
const substrateThicknessHeader = createDiv(substrateThicknessBox, 'settingsHeader');
const substrateThicknessSlider = createSlider(substrateThicknessBox, 'settingsSlider', 0, 1, 0.01, 8);

substrateThicknessHeader.textContent = `Substrate Thickness : ${substrateThicknessSlider.value} mm`;

substrateThicknessSlider.addEventListener('input', () => {
    substrateThicknessHeader.textContent = `Substrate Thickness : ${substrateThicknessSlider.value} mm`;

    updateValues();
});

// ________________________________________ Extrusion Speed ________________________________________
const extrusionSpeedBox = createDiv(column3, 'settingsBox');
const extrusionSpeedHeader = createDiv(extrusionSpeedBox, 'settingsHeader');
const extrusionSpeedSlider = createSlider(extrusionSpeedBox, 'settingsSlider', 30, 240, 5, 9);

extrusionSpeedHeader.textContent = `Extrusion Speed : ${extrusionSpeedSlider.value} mm/min`;

extrusionSpeedSlider.addEventListener('input', () => {
    extrusionSpeedHeader.textContent = `Extrusion Speed : ${extrusionSpeedSlider.value} mm/min`;

    updateValues();
});

// ________________________________________ Slicing Steps ________________________________________
const slicingStepsBox = createDiv(column3, 'settingsBox');
const slicingStepsHeader = createDiv(slicingStepsBox, 'settingsHeader');
const slicingStepsSlider = createSlider(slicingStepsBox, 'settingsSlider', 1, 100, 1, 10);

slicingStepsHeader.textContent = `Slicing Steps : ${slicingStepsSlider.value}`;

slicingStepsSlider.addEventListener('input', () => {
    slicingStepsHeader.textContent = `Slicing Steps : ${slicingStepsSlider.value}`;

    updateValues();
});

// ________________________________________ Nozzle Height ________________________________________
const nozzleHeightBox = createDiv(column3, 'settingsBox');
const nozzleHeightHeader = createDiv(nozzleHeightBox, 'settingsHeader');
const nozzleHeightSlider = createSlider(nozzleHeightBox, 'settingsSlider', 0.1, 1, 0.1, 11);

nozzleHeightHeader.textContent = `Nozzle Height : ${nozzleHeightSlider.value} mm`;

nozzleHeightSlider.addEventListener('input', () => {
    nozzleHeightHeader.textContent = `Nozzle Height : ${nozzleHeightSlider.value} mm`;

    updateValues();
});

// ________________________________________ Middle Spacing ________________________________________
const middleSpacingBox = createDiv(column3, 'settingsBox');
const middleSpacingHeader = createDiv(middleSpacingBox, 'settingsHeader');
const middleSpacingValue = createDiv(middleSpacingBox, 'settingsHeader');

middleSpacingHeader.textContent = 'Middle Spacing';

const middleSpacingMask = createDiv(middleSpacingBox, 'settingsMask');

// ________________________________________ Rectract wire ________________________________________
const retractWireBox = createDiv(column4, 'settingsBox');
const retractWireHeader = createDiv(retractWireBox, 'settingsHeader');
const retractWireCheckbox = createCheckingBox(retractWireBox, 'settingsCheckingBox', 12);

retractWireHeader.textContent = 'Rectract wire';

retractWireCheckbox.addEventListener('input', updateValues);

// ________________________________________ Full MZI ________________________________________
const fullMZIBox = createDiv(column4, 'settingsBox');
const fullMZIHeader = createDiv(fullMZIBox, 'settingsHeader');
const fullMZICheckbox = createCheckingBox(fullMZIBox, 'settingsCheckingBox', 13);

fullMZIHeader.textContent = 'Full MZI';

fullMZICheckbox.addEventListener('input', updateValues);

// ________________________________________ Purge ________________________________________
const purgeBox = createDiv(column4, 'settingsBox');
const purgeHeader = createDiv(purgeBox, 'settingsHeader');
const purgeCheckbox = createCheckingBox(purgeBox, 'settingsCheckingBox', 14);

purgeHeader.textContent = 'Purge';

purgeCheckbox.addEventListener('input', updateValues);

// ________________________________________ Ironing ________________________________________
const ironingBox = createDiv(column4, 'settingsBox');
const ironingHeader = createDiv(ironingBox, 'settingsHeader');
const ironingCheckbox = createCheckingBox(ironingBox, 'settingsCheckingBox', 15);

ironingHeader.textContent = 'Ironing';

ironingCheckbox.addEventListener('input', updateValues);

// ________________________________________ Comments ________________________________________
const commentsBox = createDiv(column4, 'settingsBox');
const commentsHeader = createDiv(commentsBox, 'settingsHeader');
const commentsCheckbox = createCheckingBox(commentsBox, 'settingsCheckingBox', 16);

commentsHeader.textContent = 'Comments';

commentsCheckbox.addEventListener('input', updateValues);



function updateValues() {
    armsSpacingMask.style.display = fullMZICheckbox.checked ? 'none' : 'block';
    middleSpacingMask.style.display = fullMZICheckbox.checked ? 'none' : 'block';

    centralSpacingSlider.max = Math.floor(curvedGuidesLengthSlider.value) - parseInt(centralSpacingSlider.step);
    centralSpacingSlider.value = Math.min(parseInt(centralSpacingSlider.value), parseInt(centralSpacingSlider.max));
    centralSpacingHeader.textContent = `Central Spacing : ${centralSpacingSlider.value} mm`;

    curveLength = parseInt(curvedGuidesLengthSlider.value) - parseInt(centralSpacingSlider.value);

    curvatureRadiusSlider.min = Math.ceil(curveLength * 0.25);
    curvatureRadiusSlider.value = Math.max(parseInt(curvatureRadiusSlider.min), parseInt(curvatureRadiusSlider.value));
    curvatureRadiusHeader.textContent = `Curvature Radius : ${curvatureRadiusSlider.value} mm`;

    armsSpacingSlider.max = 2 * parseFloat(extrusionThicknessSlider.value) - parseFloat(armsSpacingSlider.step);
    armsSpacingSlider.value = Math.min(parseFloat(armsSpacingSlider.value), parseFloat(armsSpacingSlider.max));
    armsSpacingHeader.textContent = `Arms Spacing : ${armsSpacingSlider.value} mm`;

    radius = parseInt(curvatureRadiusSlider.value);
    angle = Math.asin(curveLength / 4 / radius);
    const lowerRadius = parseInt(curvatureRadiusSlider.value) - parseFloat(extrusionThicknessSlider.value) * 0.5;
    middleSpacing = 4 * lowerRadius - curveLength / Math.tan(Math.asin(curveLength / 4 / lowerRadius)) + parseFloat(armsSpacingSlider.value);
    nozzleHeight = (parseFloat(nozzleHeightSlider.value) + parseFloat(substrateThicknessSlider.value)).toFixed(2);
    nozzleHop = (parseFloat(nozzleHeightSlider.value) + parseFloat(substrateThicknessSlider.value) + 1).toFixed(2);
    K = parseFloat(extrusionThicknessSlider.value) * parseFloat(nozzleHeightSlider.value) / (Math.PI * filamentThickness * filamentThickness * 0.25);

    middleSpacingValue.textContent = `${Math.round(middleSpacing * 100) / 100} mm`;

    localStorage.setItem('MZISettings', `${curvatureRadiusSlider.value};${straightGuidesLengthSlider.value};${curvedGuidesLengthSlider.value};${centralSpacingSlider.value};${extrusionThicknessSlider.value};${armsSpacingSlider.value};${nozzleTemperatureSlider.value};${bedTemperatureSlider.value};${substrateThicknessSlider.value};${extrusionSpeedSlider.value};${slicingStepsSlider.value};${nozzleHeightSlider.value};${retractWireCheckbox.checked};${fullMZICheckbox.checked};${purgeCheckbox.checked};${ironingCheckbox.checked};${commentsCheckbox.checked}`);

    updateSlicingRender();
    updateCode();
}
