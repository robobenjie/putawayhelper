// scanner.js

(async () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const cameraSelect = document.getElementById('cameraSelect');
    const scanResultsTableBody = document.querySelector('#scanResultsTable tbody');
    const notification = document.getElementById('notification');

    // Function to show notifications
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.style.display = 'block';
        notification.style.borderColor = isError ? 'red' : 'green';
        notification.style.backgroundColor = isError ? '#f8d7da' : '#d1e7dd';
        notification.style.color = isError ? '#721c24' : '#0f5132';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000); // Hide after 3 seconds
    }

    // Check if BarcodeDetector is supported
    if (!('BarcodeDetector' in window)) {
        showNotification('Barcode Detector is not supported by this browser.', true);
        console.log('Barcode Detector is not supported by this browser.');
        return;
    } else {
        console.log('Barcode Detector supported!');
    }

    // Specify the barcode formats to detect
    const formats = [
        'code_128',
        'code_39',
        'ean_13',
        'ean_8',
        'codabar',
        'upc_a',
        'upc_e',
        'itf',
    ];

    // Create a new BarcodeDetector instance
    const barcodeDetector = new BarcodeDetector({ formats });

    let stream;
    let devices;
    let currentDeviceId;

    // Load and parse the CSV data
    const csvData = `location,upc,qty,description
C1-003-A1,639277447654,4,Bubbles
C1-003-A2,065030840644,1,USB to miniUSB
C1-003-A3,195464300435,6,Dominos
C1-003-A4,622222418298,6,Happy Pets
C1-003-A5,035000391971,3,drying sheets`;

    // Function to parse CSV data into an array of objects
    function parseCSV(csv) {
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, index) => {
                obj[header.trim()] = values[index].trim();
            });
            return obj;
        });
        return data;
    }

    const items = parseCSV(csvData);
    console.log('Parsed Items:', items);

    // For faster lookup, create a Map of UPC to item
    const itemsMap = new Map();
    items.forEach(item => {
        itemsMap.set(item.upc, item);
    });
    console.log('Items Map Created:', itemsMap);

    // Function to stop existing streams
    const stopExistingStreams = () => {
        if (stream) {
            console.log('Stopping existing streams.');
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    };

    // Function to start the video stream
    const startVideo = async (deviceId) => {
        stopExistingStreams();
        try {
            console.log(`Attempting to access camera with deviceId: ${deviceId}`);
            stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
            });
            video.srcObject = stream;
            video.play();
            showNotification('Camera started successfully.');
            console.log('Camera started successfully.');
        } catch (err) {
            console.error('Error accessing the camera with deviceId:', deviceId, err);
            if (err.name === 'OverconstrainedError') {
                showNotification('Selected camera is unavailable. Switching to default camera.', false);
                try {
                    console.log('Attempting to access default camera.');
                    // Attempt to access the default camera
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                    });
                    video.srcObject = stream;
                    video.play();
                    showNotification('Default camera started successfully.');
                    console.log('Default camera started successfully.');
                } catch (fallbackErr) {
                    console.error('Error accessing the default camera:', fallbackErr);
                    showNotification('Unable to access any camera.', true);
                    return;
                }
            } else if (err.name === 'NotAllowedError') {
                showNotification('Camera access was denied. Please allow camera access and refresh the page.', true);
            } else if (err.name === 'NotFoundError') {
                showNotification('No camera found with the specified constraints.', true);
            } else {
                showNotification('Error accessing the camera.', true);
            }
            return;
        }
    };

    // Function to populate the camera selector
    const populateCameraSelect = async () => {
        try {
            console.log('Requesting temporary camera access to get device labels.');
            // Request camera access to get device labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Immediately stop the temporary stream
            tempStream.getTracks().forEach(track => track.stop());
            console.log('Temporary camera access granted.');

            devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            cameraSelect.innerHTML = '';
            
            if (videoDevices.length === 0) {
                showNotification('No video input devices found.', true);
                console.log('No video input devices found.');
                return;
            }

            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Log available devices
            console.log('Available Video Devices:', videoDevices);

            // Set the current device ID to the first one
            currentDeviceId = videoDevices[0].deviceId;
            cameraSelect.value = currentDeviceId;
            console.log('Selected Camera ID:', currentDeviceId);
            await startVideo(currentDeviceId);
        } catch (err) {
            console.error('Error enumerating devices:', err);
            showNotification('Error accessing video devices.', true);
        }
    };

    // Event listener for camera selection change
    cameraSelect.addEventListener('change', async () => {
        currentDeviceId = cameraSelect.value;
        console.log('Camera changed to ID:', currentDeviceId);
        await startVideo(currentDeviceId);
    });

    // Start scanning when the video is playing
    video.addEventListener('playing', () => {
        console.log('Video is playing, starting scan...');
        scanFrameWithReset();
    });

    // Keep track of the last scanned barcode to prevent duplicates
    let lastScannedCode = null;
    let barcodeOutOfViewTimeout;
    const barcodeOutOfViewDelay = 1000; // milliseconds

    const resetLastScannedCode = () => {
        console.log('Resetting lastScannedCode.');
        lastScannedCode = null;
    };

    // Function to scan frames for barcodes with reset functionality
    const scanFrameWithReset = async () => {
        try {
            const barcodes = await barcodeDetector.detect(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (barcodes.length > 0) {
                // Clear the timeout since barcode is still in view
                clearTimeout(barcodeOutOfViewTimeout);
                for (const barcode of barcodes) {
                    // Only process if it's a new barcode
                    const scannedUPC = barcode.rawValue;
                    if (scannedUPC !== lastScannedCode) {
                        lastScannedCode = scannedUPC;

                        console.log('Barcode detected:', barcode);
                        // Draw bounding box
                        const cornerPoints = barcode.cornerPoints;
                        ctx.beginPath();
                        ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
                        for (let i = 1; i < cornerPoints.length; i++) {
                            ctx.lineTo(cornerPoints[i].x, cornerPoints[i].y);
                        }
                        ctx.closePath();
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = 'red';
                        ctx.stroke();

                        // Look up the barcode in the items map
                        const item = itemsMap.get(scannedUPC);

                        let description, location;
                        if (item) {
                            description = item.description;
                            location = item.location;
                        } else {
                            description = 'Unknown Item';
                            location = 'N/A';
                        }

                        // Get the current timestamp
                        const timestamp = new Date().toLocaleString();

                        // Create a new row and insert at the top
                        const newRow = document.createElement('tr');
                        newRow.innerHTML = `
                            <td>${timestamp}</td>
                            <td class="small">${description}</td>
                            <td>${location}</td>
                            <td class="small">${scannedUPC}</td>
                        `;
                        // Insert the new row at the beginning of the table body
                        scanResultsTableBody.insertBefore(newRow, scanResultsTableBody.firstChild);

                        // Highlight the new row
                        newRow.classList.add('highlight');
                        setTimeout(() => {
                            newRow.classList.remove('highlight');
                        }, 2000); // Remove highlight after 2 seconds

                        // Break to avoid processing multiple barcodes in one frame
                        break;
                    }
                }
            } else {
                // Start a timeout to reset lastScannedCode after the barcode is out of view
                if (lastScannedCode !== null && !barcodeOutOfViewTimeout) {
                    console.log('Barcode out of view, starting timeout to reset.');
                    barcodeOutOfViewTimeout = setTimeout(() => {
                        resetLastScannedCode();
                        barcodeOutOfViewTimeout = null;
                    }, barcodeOutOfViewDelay);
                }
            }
        } catch (err) {
            console.error('Error detecting barcode:', err);
            showNotification('Error detecting barcode.', true);
        }
        requestAnimationFrame(scanFrameWithReset);
    };

    // Initialize the camera selector and start scanning
    await populateCameraSelect();

})();
