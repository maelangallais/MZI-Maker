
const dowloadButton = document.querySelector('#downloadButton');

dowloadButton.addEventListener('click', () => {
    const code = codeElement.textContent;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Generated Code.gcode';
    a.click();

    URL.revokeObjectURL(url);
});



const codeElement = document.querySelector('#codeOutput');
const preElement = codeElement.parentElement;

function updateCode() {
    codeElement.textContent = generateGCode();

    Prism.highlightElement(codeElement);

    const isScrollableX = preElement.scrollWidth > preElement.clientWidth;
    const isScrollableY = preElement.scrollHeight > preElement.clientHeight;
    preElement.style.borderBottomLeftRadius = isScrollableX ? '0' : '5vh';
    preElement.style.borderBottomRightRadius = isScrollableX || isScrollableY ? '0' : '5vh';
    preElement.style.borderTopRightRadius = isScrollableY ? '0' : '5vh';
}

function generateGCode() {
    const lines = [];
    
    const comments = commentsCheckbox.checked;
    function addBlank() {
        lines.push("");
    }
    function addComment(comment) {
        if (comments) lines.push(comment);
    }
    function addLine(commande, text = "") {
        if (comments) {
            lines.push(`${commande}${text}`);
        } else {
            lines.push(commande);
        }
    }

    const lowestPoint = { x: pointsForMZI[0].x, y: pointsForMZI[0].y };
    const highestPoint = { x: pointsForMZI[0].x, y: pointsForMZI[0].y };
    pointsForMZI.forEach(point => {
        if (point.x < lowestPoint.x) lowestPoint.x = point.x;
        else if (point.x > highestPoint.x) highestPoint.x = point.x;
        
        if (point.y < lowestPoint.y) lowestPoint.y = point.y;
        else if (point.y > highestPoint.y) highestPoint.y = point.y;
    });
    const middle = { x: 10 + (highestPoint.x - lowestPoint.x) * 0.5, y: 10 - lowestPoint.y };
    const fullMZI = fullMZICheckbox.checked;
    const retractWire = retractWireCheckbox.checked;
    let extrudedLength = 0;

    addComment("\n; __________ Initialization __________");

    addBlank();
    addLine('M104 S150 T0', " ; Preheat nozzle 1");
    addLine(`M190 S${bedTemperatureSlider.value}`, "     ; Launch and wait the bed heating (the longest)");
    addLine(`M104 S${nozzleTemperatureSlider.value} T0`, " ; Wait for the nozzle 1 to reach its target temperature");

    addBlank();
    addComment("; Set the position system");
    addLine('G90', " ; Set the interpreter to absolute positions");
    addLine('G21', " ; Set units to mm");

    addBlank();
    addLine('G28', "          ; Home all axes");
    addLine('G92 X0 Y0 Z0', " ; Set the current position as the absolute zero");

    addBlank();
    addLine('T0', " ; We only set the nozzle 1 since we only use this one");

    addBlank();
    addLine('M92 E140', " ; Set the number of steps required to extrude 1mm of wire");

    if (purgeCheckbox.checked) {
        addBlank();
        addComment("; _____ Purge _____");
        addLine('G0 X50 Y50 Z1 F1000', " ; Moves the extruder away from the future drawing to purge it");
        addLine('G92 E0', "              ; Resets the extruder counter");
        
        addBlank();
        addLine('G1 E25 F250', " ; Purge the nozzle");
        addLine('G92 E0', "      ; Resets the extruder counter");

        addBlank();
        addComment("; Break off the remaining plastic wire at the end of the nozzle");
        addLine('G0 Z5 F20', "           ; Moves the bed away from the nozzle");
        addLine('G4 600', "              ; Wait 600ms");
        addLine('G0 X50 Y60 Z0 F9000', " ; Sudden move to stick itself to the bed further away")
        addLine('G4 600', "              ; Wait 600ms");
    }

    addBlank();
    addLine('G0 Z5.0 F9000', "            ; Moves the bed away from the nozzle");
    addLine('G4 300', "                   ; Wait 300ms");
    if (retractWire) addLine('G1 F1500 E-1', "             ; Pull the wire 1mm upwards to prevent it from flowing before reaching the printing area");
    addLine(`G0 X${middle.x.toFixed(3)} Y${middle.y.toFixed(3)} F9000`, " ; Positions itself in the center of the bed");
    addBlank();
    addLine('M1001', " ; Indicates to the printer that initialization is complete");


    addBlank();
    addComment("\n; __________ Printing __________");

    addBlank();
    addLine('M117 Printing', " ; Displays on the screen that the printing is starting");

    addBlank();
    addLine('M82', "    ; Set the extrusion motor to absolute mode (meaning that the extrusion accumulates from one move to another)");
    addLine('G92 E0', " ; Resets the extruder counter");

    addBlank();
    addLine('M107', " ; Turn off the fan");

    addBlank();
    addLine(`G0 F600 Z${nozzleHop}`, "      ; Z-hop");
    addLine(`G0 F${moveSpeed}`, "           ; Speed to move to the starting point");
    addLine(`G0 X${(middle.x + pointsForMZI[0].x).toFixed(3)} Y${(middle.y + pointsForMZI[0].y).toFixed(3)}`, " ; XY-positioning");
    addLine(`G0 Z${nozzleHeight}`, "           ; Z-positioning");
    addLine(`G1 F1500 E${extrudedLength.toFixed(3)}`, "        ; Set the wire to 0mm to prepare the extrusion");
    addLine(`G0 F${extrusionSpeedSlider.value}`, "            ; Set the print speed for the next step");
    
    addBlank();
    addComment("; Lines to draw the MZI piece");
    for (let i = 0; i < pointsForMZI.length - 1; i++) {
        const dx = pointsForMZI[i + 1].x - pointsForMZI[i].x;
        const dy = pointsForMZI[i + 1].y - pointsForMZI[i].y;
        
        const wireLength = Math.sqrt((dx * dx) + (dy * dy));
        extrudedLength += K * wireLength;
        
        addLine(`G1 X${(middle.x + pointsForMZI[i + 1].x).toFixed(3)} Y${(middle.y + pointsForMZI[i + 1].y).toFixed(3)} E${extrudedLength.toFixed(3)}`);
    }

    addBlank();
    addLine(`G0 F600 Z${nozzleHop}`, " ; Z-hop");

    if (fullMZI) {
        addBlank();
        addComment("; Second half of the MZI");

        addBlank();
        if (retractWire) addLine(`G1 F1500 E${(extrudedLength - 1).toFixed(3)}`, "    ; Rewind the wire 1mm upwards to prevent it from flowing at the end of printing");
        addLine(`G0 F${moveSpeed}`, "           ; Speed to move to the starting point");
        addLine(`G0 X${(middle.x + pointsForMZI[0].x).toFixed(3)} Y${(middle.y + pointsForMZI[0].y).toFixed(3)}`, " ; XY-positioning");
        addLine(`G0 Z${nozzleHeight}`, "           ; Z-positioning");
        if (retractWire) addLine(`G1 F1500 E${extrudedLength.toFixed(3)}`, "    ; Set the wire to the nozzle's end to prepare the extrusion");
        addLine(`G0 F${extrusionSpeedSlider.value}`, "            ; Set the print speed for the next step");

        addBlank();
        for (let i = 0; i < pointsForMZI.length - 1; i++) {
            const dx = pointsForMZI[i + 1].x - pointsForMZI[i].x;
            const dy = pointsForMZI[i + 1].y - pointsForMZI[i].y;

            const wireLength = Math.sqrt((dx * dx) + (dy * dy));
            extrudedLength += K * wireLength;

            addLine(`G1 X${(middle.x + pointsForMZI[i + 1].x).toFixed(3)} Y${(middle.y - pointsForMZI[i + 1].y + parseFloat(armsSpacingSlider.value)).toFixed(3)} E${extrudedLength.toFixed(3)}`);
        }

        addBlank();
        addLine(`G0 F600 Z${nozzleHop}`, " ; Z-hop");
    }

    addBlank();
    addLine(`G1 F1500 E${(extrudedLength - 3).toFixed(3)}`, " ; Rewind the wire 3mm upwards to prevent it from flowing at the end of printing");

    if (ironingCheckbox.checked) {
        addBlank();
        addComment("; _____ Ironing _____");

        addLine(`G0 F${moveSpeed}`, "           ; Speed to move to the starting point");
        addLine(`G0 X${(middle.x + pointsForMZI[0].x).toFixed(3)} Y${(middle.y + pointsForMZI[0].y).toFixed(3)}`, " ; XY-positioning");
        addLine(`G0 Z${parseFloat(extrusionThicknessSlider.value).toFixed(2)}`, "           ; Z-positioning");
        addLine(`G0 F${extrusionSpeedSlider.value}`, "            ; Set the print speed for the next step");

        const lastPoint = pointsForMZI[pointsForMZI.length - 1];
        addLine(`G0 X${(middle.x + lastPoint.x).toFixed(3)} Y${(middle.y + lastPoint.y).toFixed(3)}`, " ; Go to the last point");

        addBlank();
        addLine(`G0 F600 Z${nozzleHop}`, " ; Z-hop");
    }

    addBlank();
    addLine('G91', "    ; Set the interpretor to relative positions");
    addLine('G0 Z10', " ; Move down the bed");
    addLine('G90', "    ; Reset the interpretor to absolution positions");

    addBlank();
    addLine('M1002', " ; Indicates to the printer that printing is complete");


    addBlank();
    addComment("\n; __________ End of script __________");

    addBlank();
    addLine('M140 S0', "    ; Turn off bed heating");
    addLine('M104 S0 T0', " ; Turn off nozzle 1 heating");

    addBlank();
    addLine('M117 Print Complete', " ; Displays the end of printing on the screen");

    addBlank();
    addLine('G28 X0 Y0', " ; Reset the nozzle to its home");

    addBlank();
    addLine('M84', " ; Disable steppers");

    addComment("\n");
    return lines.join('\n');
}
