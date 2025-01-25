const fileInput = document.getElementById('file-input');
const status = document.getElementById('status');
const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const qrDisplay = document.getElementById('qr-display');
const jsonEditor = document.getElementById('json-editor');

let currentJsonData = {};
// console.log(Object.isFrozen(currentJsonData)); // Should return false
let prefixBinary = new Uint8Array([0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0, 242, 2]);
console.log('prefix binary:', prefixBinary);
let postfixBinary = new Uint8Array([11]);
console.log('postfix binary:', postfixBinary);

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        status.textContent = 'Please upload a file.';
        return;
    }

    // Load image onto canvas
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        processQR(); //322,300,291,246,0,0,0,0
        // console.log(Object.isFrozen(currentJsonData)); // Should return false
    };
    img.src = URL.createObjectURL(file);
});

function renderJsonEditor() {
    jsonEditor.innerHTML = ''; // Clear previous fields

    for (const key in currentJsonData) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'json-field';

        const label = document.createElement('label');
        label.textContent = `${key}: `;
        label.setAttribute('for', `field-${key}`);

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `field-${key}`;
        input.value = currentJsonData[key];

        var incrementButton;
        if (key == 'PlayerId') {
            incrementButton = document.createElement('button');
            incrementButton.textContent = '+';
            incrementButton.addEventListener('click', () => {
                console.log(currentJsonData)
                let playerId = currentJsonData['PlayerId'];
                currentJsonData['PlayerId'] = (BigInt('0x' + playerId) + 1n).toString(16);
                input.value = currentJsonData[key];
                updateQR();
            });
        }

        // Add change listener to update JSON and regenerate QR
        input.addEventListener('input', (event) => {
            if (event.target.value.includes(',')) {
                currentJsonData[key] = event.target.value.split(',');
            } else {
                currentJsonData[key] = event.target.value;
            }
            updateQR();
        });

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        if (key == 'PlayerId') {
            fieldDiv.appendChild(incrementButton);
        }
        jsonEditor.appendChild(fieldDiv);
    }
}

function processQR() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(imageData);
    const qrCodeData = jsQR(imageData.data, canvas.width, canvas.height);

    console.log(qrCodeData);
    if (qrCodeData) {
        status.textContent = 'QR Code detected';
        let rawData;
        let uint8Array;
        console.log(qrCodeData);

        // Attempt to use qrCodeData.data as a string, or fallback to binary data
        if (qrCodeData.data && typeof qrCodeData.data === 'string') {
            rawData = qrCodeData.data;
        } else if (qrCodeData.binaryData) {
            uint8Array = new Uint8Array(qrCodeData.binaryData);
            console.log(uint8Array);
            console.log(uint8Array.length);
            // const decodedData = checkForBOM(uint8Array);
            // console.log(decodedData);

            rawData = new TextDecoder('utf-8').decode(uint8Array);
            console.log(rawData);
            console.log(rawData.length);
        } else {
            status.textContent = 'QR Code contains unsupported data.';
            return;
        }

        try {
            // Extract prefix and JSON content
            // const prefix = rawData.substring(0, 24);
            // const postfix = rawData.substring(rawData.length - 1);
            const strData = rawData.substring(24, rawData.length - 1);

            // Offset where the JSON is supposed to start (743 bytes or 0x02e7)
            const offset = 0x8803; // or 743 in decimal

            // Extract the chunk starting at the offset (adjust the length if needed)
            const chunk = uint8Array.slice(offset);
            console.log(chunk);
            const decodedChunk = new TextDecoder('utf-8').decode(chunk);
            console.log('chunk');
            console.log(decodedChunk);

            prefixBinary = uint8Array.slice(0, 24);
            postfixBinary = uint8Array.slice(uint8Array.length - 1);

            var hexString = Array.from(new Uint8Array(prefixBinary))
                .map((byte) => byte.toString(16).padStart(2, '0'))
                .join(' ');
            console.log('prefix hex');
            console.log(hexString);

            // hexString = hexString.substring(0, hexString.length-1) + '0'
            // prefixBinary=hexStringToUint8Array(hexString)

            // console.log(hexString)
            // console.log(prefixBinary)

            const hexStringWhole = Array.from(new Uint8Array(uint8Array))
                .map((byte) => byte.toString(16).padStart(2, '0'))
                .join(' ');
            console.log('whole hex');
            console.log(hexStringWhole);

            currentJsonData = JSON.parse(strData);
            console.log('json length: ', strData.length);

            // const strData = rawData.substring(24, rawData.length - 1);
            // console.log("Prefix:", prefix);
            // console.log("Postfix:", postfix);
            console.log('text:', strData);
            console.log('prefix binary:', prefixBinary);
            console.log('postfix binary:', postfixBinary);
            const textDecoder = new TextDecoder('utf-8'); // Specify encoding if necessary (e.g., "utf-8")
            // const string = textDecoder.decode(uint8Array);
            console.log('prefix string:', textDecoder.decode(prefixBinary));
            console.log('postfix string:', textDecoder.decode(postfixBinary));

            // const uint8Array = new Uint8Array([0x01, 0x02, 0x03, 0x04]); // Example data
            // const buffer = prefixBinary.buffer; // Extract the ArrayBuffer from the Uint8Array
            // const dataView = new DataView(buffer);

            // Convert to integer (big-endian)
            // const intBigEndian = dataView.getUint32(0, false); // Pass false for big-endian
            // console.log("Big-endian prefix integer:", intBigEndian); // Output: 16909060

            // Convert to integer (little-endian)
            // const intLittleEndian = dataView.getUint32(0, true); // Pass true for little-endian
            // console.log("Little-endian prefix integer:", intLittleEndian);

            renderJsonEditor();
            updateQR();

            // const jsonData = JSON.parse(strData); // Parse JSON from the middle part
            // modifyAndDisplayQR(jsonData, prefixBinary, postfixBinary);
        } catch (error) {
            console.error(error);
            status.textContent = 'Invalid QR Code JSON content.';
        }
    } else {
        status.textContent = 'No QR Code detected.';
    }
}

function updateQR() {
    const jsonStri = JSON.stringify(currentJsonData);
    const jsonBinary = stringToBinary(jsonStri);
    console.log(currentJsonData);

    // very important
    // jsonLength - (firstByte value) = ((lastByte value) - 1) * 128
    // 382 - fb = (lb-1) * 128
    // 382 - 254 = (1) * 128
    var jsonLength = jsonStri.length;
    var byte1 = (jsonLength % 128) + 128;
    var byte2 = Math.floor((jsonLength - 128) / 128) + 1;
    console.log('length bytes');
    console.log(byte1);
    console.log(byte2);
    prefixBinary[prefixBinary.length - 2] = byte1;
    prefixBinary[prefixBinary.length - 1] = byte2;
    console.log(prefixBinary);
    const binaryData = concatenate([
        prefixBinary,
        jsonBinary,
        postfixBinary,
    ]);

    // Modify the JSON (example: add/update a property)
    // jsonData.PlayerId = "56ea280284b34490"
    // jsonData.PlayerName = "Jeremi"
    // var jsonStr = JSON.stringify(jsonData)

    // console.log(JSON.stringify(jsonData))
    // console.log(`${prefix}${JSON.stringify(jsonData)}${postfix}`);

    // Convert back to a string
    // const modifiedData = `${prefix}${JSON.stringify(jsonData)}${postfix}`;

    // const binData = stringToBinary(modifiedData);
    // console.log(stringToBinary(jsonStr))
    // console.log(prefix)
    // console.log(postfix)
    // var binData = concatenate([prefix, stringToBinary(jsonStr), postfix])
    // console.log(binData)
    // var st = (new TextDecoder).decode(binData)
    // console.log(st)
    var cArray = new Uint8ClampedArray(binaryData);
    // console.log(cArray)

    // Generate a new QR code
    QRCode.toCanvas(
        canvas,
        [{ data: cArray, mode: 'byte' }], //st
        { version: 23 }, //{ width: 800, scale:6 }
        (error) => {
            if (error) {
                status.textContent = 'Error generating QR Code.';
                console.error(error);
                return;
            }
            status.textContent = 'QR Code generated';
            qrDisplay.innerHTML = ''; // Clear previous display
            qrDisplay.appendChild(canvas);
        }
    );

    console.log(Object.isFrozen(currentJsonData));
}

function modifyAndDisplayQR(jsonData, prefix, postfix) {
    // Modify the JSON (example: add/update a property)
    // jsonData.PlayerId = "56ea280284b34490"
    // jsonData.PlayerName = "Jeremi"
    var jsonStr = JSON.stringify(jsonData);

    console.log(JSON.stringify(jsonData));
    // console.log(`${prefix}${JSON.stringify(jsonData)}${postfix}`);

    // Convert back to a string
    // const modifiedData = `${prefix}${JSON.stringify(jsonData)}${postfix}`;

    // const binData = stringToBinary(modifiedData);
    console.log(stringToBinary(jsonStr));
    console.log(prefix);
    console.log(postfix);
    var binData = concatenate([prefix, stringToBinary(jsonStr), postfix]);
    console.log(binData);
    var st = new TextDecoder().decode(binData);
    console.log(st);
    var cArray = new Uint8ClampedArray(binData);
    console.log(cArray);

    // Generate a new QR code
    QRCode.toCanvas(
        canvas,
        [{ data: cArray, mode: 'byte' }], //st
        { version: 23 }, //{ width: 800, scale:6 }
        (error) => {
            if (error) {
                status.textContent = 'Error generating QR Code.';
                console.error(error);
                return;
            }
            status.textContent = 'QR Code generated';
            qrDisplay.innerHTML = ''; // Clear previous display
            qrDisplay.appendChild(canvas);
        }
    );
}

function binaryToBase64(bin) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(bin)));
}

function base64ToBinary(base64Data) {
    const binaryString = atob(base64Data);
    const binaryArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        binaryArray[i] = binaryString.charCodeAt(i);
    }
    return binaryArray.buffer;
}

// Helper: Convert string to binary (UTF-8)
function stringToBinary(string) {
    const encoder = new TextEncoder();
    var r = encoder.encode(string);
    console.log(r);
    return r;
}

function concatenate(uint8arrays) {
    const totalLength = uint8arrays.reduce(
        (total, uint8array) => total + uint8array.byteLength,
        0
    );

    const result = new Uint8Array(totalLength);

    let offset = 0;
    uint8arrays.forEach((uint8array) => {
        result.set(uint8array, offset);
        offset += uint8array.byteLength;
    });

    return result;
}

// Check for BOM and decode accordingly
function checkForBOM(data) {
    const utf8BOM = [0xef, 0xbb, 0xbf];
    const utf16LEBOM = [0xff, 0xfe];
    const utf16BEBOM = [0xfe, 0xff];
    const utf32LEBOM = [0xff, 0xfe, 0x00, 0x00];
    const utf32BEBOM = [0x00, 0x00, 0xfe, 0xff];

    if (
        data.slice(0, 3).every((value, index) => value === utf8BOM[index])
    ) {
        console.log('UTF-8 BOM detected');
        return new TextDecoder('utf-8').decode(data.slice(3)); // Decode the data excluding BOM
    } else if (
        data.slice(0, 2).every((value, index) => value === utf16LEBOM[index])
    ) {
        console.log('UTF-16 LE BOM detected');
        return new TextDecoder('utf-16le').decode(data.slice(2)); // Decode the data excluding BOM
    } else if (
        data.slice(0, 2).every((value, index) => value === utf16BEBOM[index])
    ) {
        console.log('UTF-16 BE BOM detected');
        return new TextDecoder('utf-16be').decode(data.slice(2)); // Decode the data excluding BOM
    } else if (
        data.slice(0, 4).every((value, index) => value === utf32LEBOM[index])
    ) {
        console.log('UTF-32 LE BOM detected');
        return new TextDecoder('utf-32le').decode(data.slice(4)); // Decode the data excluding BOM
    } else if (
        data.slice(0, 4).every((value, index) => value === utf32BEBOM[index])
    ) {
        console.log('UTF-32 BE BOM detected');
        return new TextDecoder('utf-32be').decode(data.slice(4)); // Decode the data excluding BOM
    } else {
        console.log("No BOM detected or BOM doesn't match known formats");
        return new TextDecoder('utf-8').decode(data); // Default to UTF-8 if no BOM
    }
}

function hexStringToUint8Array(hexString) {
    // Remove spaces and ensure it's a clean hex string
    hexString = hexString.replace(/\s+/g, '');

    // Create a Uint8Array from the hex string
    const uint8Array = new Uint8Array(hexString.length / 2);

    for (let i = 0; i < hexString.length; i += 2) {
        uint8Array[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }

    return uint8Array;
}

var defaultJson = {
    "Version": 1,
    "PlayerId": "56ea280284b34459",
    "PlayerName": "Jeremy",
    "PartnerId": 201800,
    "Sex": 1,
    "EyeParts": 4,
    "HairStyle": 1013,
    "EyeColorIndex": 2,
    "HairColorIndex": 0,
    "SkinColorIndex": 1,
    "PlayerClothes": [
        1400142,
        291,
        236,
        5053059,
        322,
        0,
        0,
        0
    ],
    "PartnerClothes": [
        0,
        0,
        0,
        0,
        0
    ],
    "BGColor": 2,
    "Posing": 4,
    "Level": 179,
    "PlayerMyDesignId": [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ],
    "PartnerMyDesignId": [
        "",
        "",
        ""
    ]
}

var url = window.location.href
var urlArr = url.split('?')
if (urlArr.length > 1) {
    var urlParams = urlArr[1].split('&')
    if (urlParams.length > 0) {
        var urlParamObj = {}
        urlParams.forEach((param) => {
            var keyVal = param.split('=')
            urlParamObj[keyVal[0]] = keyVal[1]
        })
        console.log(urlParamObj)
        var partnerId = urlParamObj['PartnerId']
        if (partnerId) {
            defaultJson.PartnerId = partnerId
            currentJsonData = defaultJson
            console.log(currentJsonData)
            renderJsonEditor()
            updateQR()
        }
    }
}
