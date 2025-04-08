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
    const csvData = `location,upcs,qty,description
H02003X01,639277447654,4,Bubbles
H02003X04,065030840644,1,USB to miniUSB
H02003X06,195464300435,6,Dominos
H02003X08,622222418298,6,Happy Pets
H02003X10,035000391971,3,drying sheets
H02003X12,195464384794,3,Parchment Paper
H02004X01,639277784964 639277941534,8,Scrub Buddies
H02004X04,X0033FG5Y5 X002YCPW1Z,2,Green Gloves
H02004X06,07339345,10,Mentos
H02004X08,8904228153390,2,Ballpens
H02004X10,012587788066,2,trashbags
H02004X12,035000970916 9937605,1,Deodorant
H03002Y01,074729750652,3,wax paper
H03002Y04,195464256527,2,White Trashbags
H03002Y06,639277786746,3,Aluminum foil sheets
H03002Y08,B09B316YZS,8,AI Kit
H03002Y10,195464309896,3,colored index cards
H03003Y01,B0429,2,arducam
H03003Y04,P2278E P2278,2,matrix
H03003Y08,X001L2BJT3,2,Dan Yee Ethernet
H03003Y10,fake1234,10,What is this- a pool noodle for ants?
H03003Y12,639277055835,5,Glass Gems
H03004Y01,016000612709,7,Bugle chips
H03004Y04,B0473,1,Arducam
H03004Y06,fake91011,10,Gum two-pack
H03004Y08,850002951615,3,barbie tissue
H03004Y12,639277117304,3,Led Candle
G01001A01,X001G8CGIP,3,Poyiccot
G02001A01,038000016110,1,Special K Cereal
G03001A01,020000104737,2,Can of Corn
G04001A01,A00113,3,cable
G05001A01,639277337801,2,Vanilla Candle
G06001A01,X00311ALBT,1,USB Type-C Cable
G07001A01,X002YDGY75,3,usb-c cable
G08001A01,870223001951,2,Coconut Lotion
G09001A01,074026908886,3,oats
C01001X01,878106003573,1,Candle (Angel)
C01001X02,878106003528,1,Candle (Mary)
C01001X03,878106003535,1,Candle (Jesus)
C01001X04,639277423320,1,Laundry Detergent
C01001X05,016000416604,2,Mashed Potatoes Mix
C01001X06,639277655509,2,Napkins
C01001Y01,079100532667,2,Dog Bones
C01001Y02,195464076651,1,ear buds
C01001Y03,831527005113,1,eye drops
C01001Y04,072486002205,2,corn muffin mix
C01001Y05,086106072004,3,Saltines
C01001Y06,042400214434,2,tootie fruities cereal
C01001Z01,639277691347,1,plastic wrap
C01001Z02,017714001018,1,Aspirin
C01001Z03,639277294050,2,earplugs
C01001Z04,029900212603,1,Trashbags
C01001Z05,X002TWAQTN,1,Power Monitor
C01001Z06,037000527695,4,Charmin Toilet Paper
C01002X01,098487954862,1,Penne Rigate Pasta
C01002X02,098487954947,1,Spaghetti Pasta
C01002X03,098487954909,1,Small Elbows Pasta
C01002X04,040000422082,2,Musketeer Candy
C01002X05,042400136262,2,Golden Puffs
C01002X06,190569351122,2,Sliced Potatoes
C01002Y01,051000212245,2,spagettios
C01002Y02,051000000163,2,soup
C01002Y03,078883760229,2,canned jalapeño
C01002Y04,013300602355,2,cake mix
C01002Y05,072320110110,3,animal crackers
C01002Y06,041789001116,4,lime chili chicken noodles
C01002Z01,059642164007,500,gum
C01002Z02,071082100698,6,cookies
C01002Z03,030100773986,8,cookies
C01002Z04,047495210040,2,Raspberry Fig Bar
C01002Z05,047495210026,2,Original Fig Bar
C01002Z06,072392015528,2,Green Apple Gelatin
C01003X01,098487955210,3,Cream of Mushroom soup
C01003X02,076828047237,1,Wet Ones Sanitizing Wipes
C01003X03,037466014005,2,Lindor Chocolate
C01003X04,071082100681,3,E.L. Fudge Elfwich
C01003X05,047495117813,24,Nature Valley Original Fig
C01003X06,043152031263,2,Multipurpose Cleaner
C01003Y01,754918382603,2,Butter Toffee popcorn
C01003Y02,639277157249,2,Sandwich bags
C01003Y03,041501009451,1,Taco Shells
C01003Y04,052000122510,8,Gatorade Glacier freeze
C01003Y05,052000122510,15,Gatorade Glacier Freeze
C01003Y06,052000043396,13,Gatorade Glacier Cherry
C01003Z01,028400040112 http://pepsico.info/490tb6,7,Cheetos
C01003Z02,028400090896 http://pepsico.info/490j2v,4,Doritos
C01003Z03,072392015511,2,Sonic Gelatin
C01003Z04,041501100288,2,Red Chile Sauce
C01003Z05,028800130536,2,Kidney Beans
C01003Z06,647878245869,1,Enchilada Sauce
C01004X01,834576005875,3,Body Lotion
C01004X02,827854015406,2,Dish Grease & Stain Remover
C01004X03,839294002519,3,Mouthwash
C01004X04,639277937056,2,Bulbs
C01004X05,079100528707,2,Dog Bones
C01004X06,X00308BEOB http://theonlybean.com/costco,1,High Protein Snack
C01004Y01,839294562761,3,Conditioner
C01004Y02,839294603266,3,Body Wash
C01004Y03,849607071590,3,Dish Soap
C01004Y04,816559010830,1,Aloe Deodorant Bar
C01004Y05,070330916142,3,Silky Touch Razors
C01004Y06,639277498533,1,Six Men’s Razors
C01004Z01,875010002128,3,Bubble Bath
C01004Z02,722429420183,3,Laundry Detergent
C01004Z03,875010001756,3,Shampoo
C01004Z04,017000115399,1,Soap Bar
C01004Z05,063435891568,2,Scotties Facial Tissue
C01004Z06,011225003943,2,Simply White Paper Towels
C02001Z04,123fork456,16,Knife
C02001Z05,fake5678,10,badge-clip
C02001Z06,123spoon456,19,Fork
C02002Y03,X001Y366AV,6,Dan Yee cable
C02002Y06,041789001215,12,Ramen
C02002Z05,888849000234,12,Purple Protein Bar
    `;

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
            currentDeviceId = videoDevices[videoDevices.length - 1].deviceId;
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
                            <td class="big">${description}</td>
                            <td class="big">${location}</td>
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
