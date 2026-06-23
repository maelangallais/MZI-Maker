
const simulationContainer = document.querySelector('#simulation');
const canvas = document.querySelector('#canvas');

const ctx = canvas.getContext('2d');


const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');


function updateSlicingRender() {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    draw();

    updateDrawing();
}


if (!localStorage.getItem('simulationCanvas')) localStorage.setItem('simulationCanvas', '1;0;0');
let scale = parseFloat(localStorage.getItem('simulationCanvas').split(';')[0]);
let offsetX = parseFloat(localStorage.getItem('simulationCanvas').split(';')[1]);
let offsetY = parseFloat(localStorage.getItem('simulationCanvas').split(';')[2]);

let isPanning = false;
let lastX = 0;
let lastY = 0;

function resizeCanvas() {
    canvas.width = simulationContainer.clientWidth;
    canvas.height = simulationContainer.clientHeight;

    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    updateSlicingRender();
}
window.addEventListener('resize', resizeCanvas);

function clampOffsets() {
    const scaledWidth = offscreenCanvas.width * scale;
    const scaledHeight = offscreenCanvas.height * scale;

    const minX = Math.min(0, canvas.width - scaledWidth);
    const maxX = 0;
    const minY = Math.min(0, canvas.height - scaledHeight);
    const maxY = 0;

    offsetX = Math.max(minX, Math.min(offsetX, maxX));
    offsetY = Math.max(minY, Math.min(offsetY, maxY));
}

canvas.addEventListener('mousedown', (e) => {
    isPanning = true;

    lastX = e.clientX;
    lastY = e.clientY;
});
canvas.addEventListener('mousemove', (e) => {
    if (!isPanning) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;

    offsetX += deltaX;
    offsetY += deltaY;

    lastX = e.clientX;
    lastY = e.clientY;

    clampOffsets();
    updateDrawing();
});
canvas.addEventListener('mouseup', () => isPanning = false);
canvas.addEventListener('mouseleave', () => isPanning = false);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = Math.exp(wheel * zoomIntensity);

    const newScale = Math.max(1, scale * zoomFactor);

    const actualRatio = newScale / scale;

    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    offsetX = mouseX - (mouseX - offsetX) * actualRatio;
    offsetY = mouseY - (mouseY - offsetY) * actualRatio;

    scale = newScale;

    clampOffsets();
    updateDrawing();
}, { passive: false });



function updateDrawing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    localStorage.setItem('simulationCanvas', `${scale};${offsetX};${offsetY}`);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // draw();
    ctx.drawImage(offscreenCanvas, 0, 0);

    ctx.restore();
}

function getArcPoints(x, y, radius, startAngle, endAngle, slices) {
    const points = [];
    const angleStep = (endAngle - startAngle) / slices;

    for (let i = 0; i <= slices; i++) {
        const currentAngle = startAngle + (i * angleStep);

        const px = x + Math.cos(currentAngle) * radius;
        const py = y + Math.sin(currentAngle) * radius;

        points.push({ x: px, y: py });
    }

    return points;
}

let pointsForMZI = [];
function draw() {
    const length1 = parseInt(straightGuidesLengthSlider.value);
    const length2 = parseInt(curvedGuidesLengthSlider.value) * 0.5;

    const halfSpacing = parseFloat(armsSpacingSlider.value) * 0.5;
    const fullMZI = fullMZICheckbox.checked;

    const totalLength = 2 * (length1 + length2);
    const mmsPerPixel = totalLength * 1.2 / canvas.width;
    const middleWidth = canvas.width * 0.5;
    const middleHeight = canvas.height * 0.5;

    pointsForMZI = getPoints();

    offscreenCtx.beginPath();
    for (let half = 0; half < 2; half++) {
        if (half && !fullMZI) break;

        pointsForMZI.forEach((point, index) => {
            let py = point.y;
            if (fullMZI) {
                if (half) py = halfSpacing - py;
                else      py -= halfSpacing;
            }

            const pixelX = middleWidth + point.x / mmsPerPixel;
            const pixelY = middleHeight + py / mmsPerPixel;
            
            if (index) offscreenCtx.lineTo(pixelX, pixelY);
            else       offscreenCtx.moveTo(pixelX, pixelY);
        });
    }

    const bottomRightCorner = canvas.height * 0.9;
    const bottomPlace = middleWidth + length2 / mmsPerPixel;
    offscreenCtx.moveTo(middleWidth + totalLength * 0.5 / mmsPerPixel, bottomRightCorner);
    offscreenCtx.lineTo(bottomPlace, bottomRightCorner);
    offscreenCtx.font = `${2 / mmsPerPixel}px serif`;
    offscreenCtx.fillText(`${length1} mm`, bottomPlace, bottomRightCorner - 5);

    offscreenCtx.lineWidth = parseFloat(extrusionThicknessSlider.value) / mmsPerPixel;
    offscreenCtx.strokeStyle = 'black';
    offscreenCtx.stroke();
}

function getPoints() {
    const points = [];

    const length1 = parseInt(straightGuidesLengthSlider.value);
    const length2 = parseInt(curvedGuidesLengthSlider.value) * 0.5;
    const length3 = parseInt(centralSpacingSlider.value) * 0.5;

    const halfLength = length1 + length2;

    const startAngle = Math.PI * 0.5;
    const stepAngle = startAngle - angle;

    points.push({ x: -halfLength, y: 0 });
    points.push({ x: -length2, y: 0 });

    const arc1Points = getArcPoints(
        -length2,
        -radius,
        radius,
        startAngle,
        stepAngle,
        parseInt(slicingStepsSlider.value)
    );
    arc1Points.forEach(point => {
        points.push(point);
    });

    const arc2Points = getArcPoints(
        -length3,
        points[points.length - 1].y * 2 + radius,
        radius,
        3 * startAngle - angle,
        3 * startAngle,
        parseInt(slicingStepsSlider.value)
    );
    arc2Points.forEach(point => {
        points.push(point);
    });

    const lastPoint = points[points.length - 1];
    points.push({ x: -lastPoint.x, y: lastPoint.y });

    const arc3Points = getArcPoints(
        length3,
        lastPoint.y + radius,
        radius,
        3 * startAngle,
        3 * startAngle + angle,
        parseInt(slicingStepsSlider.value)
    );
    arc3Points.forEach(point => {
        points.push(point);
    });

    const arc4Points = getArcPoints(
        length2,
        -radius,
        radius,
        startAngle + angle,
        startAngle,
        parseInt(slicingStepsSlider.value)
    );
    arc4Points.forEach(point => {
        points.push(point);
    });

    points.push({ x: halfLength, y: 0 });

    let previousPoint = points[points.length - 1];
    for (let i = points.length - 2; i >= 0; i--) {
        if (+points[i].x.toFixed(3) == +previousPoint.x.toFixed(3) && +points[i].y.toFixed(3) == +previousPoint.y.toFixed(3)) {
            points.splice(i, 1);
        } else {
            previousPoint = points[i];
        }
    }

    return points;
}
