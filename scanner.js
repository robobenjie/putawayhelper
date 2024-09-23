// scanner.js

(async () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const cameraSelect = document.getElementById('cameraSelect');
    const scanResultsTableBody = document.querySelector('#scanResultsTable tbody');

    // Check if BarcodeDetector is supported
    if (!('BarcodeDetector' in window)) {
        alert('Barcode Detector is not supported by this browser.');
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
    C1-003-A5,035000391971,3,drying sheets
    C1-003-A6,195464384794,3,Parchment Paper
    C1-004-A1,639277784964,8,Scrub Buddies
    C1-004-A3,07339345,10,Mentos
    C1-004-A4,8904228153390,2,Ballpens
    C1-004-A5,012587788066,2,trashbags
    C1-004-A6,035000970916,1,Deoderant
    C2-002-B1,074729750652,3,wax paper
    C2-002-B2,195464256527,2,White Trashbags
    C2-002-B3,639277786746,3,Aluminum foil sheets
    C2-002-B4,B09B316YZS,8,AI Kit
    C2-002-B5,195464309896,3,colored index cards
    C2-003-B1,B0429,2,arducam
    C2-003-B2,P2278E,2,matrix
    C2-003-B2,P2278,2,matrix
    C2-003-B4,X001L2BJT3,2,Dan Yee Ethernet
    C2-003-B5,fake1234,10,What is this- a pool noodle for ants?
    C2-003-B6,639277055835,5,Glass Gems
    C2-004-B1,016000612709,7,Bugle chips
    C2-004-B2,B0473,1,Arducam
    C2-004-B3,fake91011,10,Gum two-pack
    C2-004-B4,850002951615,3,barbie tissue
    C2-004-B6,639277117304,3,Led Candle
    C3-002-B1,081357101787,2,drying sheets
    C3-002-B2,083078113155,3,Carmex
    C3-002-B3,035000980113,2,Suavitel
    C3-002-B4,B0397,1,Arducam
    C3-002-B5,8809052931353,2,Robotis
    C3-002-B6,639277287748,3,Window Marker
    C3-003-B1,639277299918,3,Balloons
    C3-003-B2,123knife456,18,Magic Bean (by the each)
    C3-003-B3,639277505606,3,apple cinamon candle
    C3-003-B4,639277938374,3,coconut lime cande
    C3-003-B5,B0331,2,arducam
    C3-003-B6,041512086816,2,Tomato Sauce
    C3-004-B1,195464009116,3,clubhouse toy
    C3-004-B2,036000119770,2,Kleenex pack
    C3-004-B4,047495210194,3,Fig Bar
    C3-004-B5,195464384817,3,parchment patty paper
    C3-004-B6,639277559937,2,notepads
    C4-001-A5,X002L5B4I5,2,Jetson
    C4-001-A1,875010002111,1,bubblebath
    C4-001-A3,OAK-FFC-OV9782-W,2,luxonis
    C4-001-A6,M23039-001,1,NUC
    C4-001-B1,X001G8CGIP,3,Poyiccot
    C4-001-B6,020000104737,2,Can of Corn
    C4-001-C1,039000086639,2,sausage
    C4-001-C4,82635AWGDVKPRQ,6,Real Sense Camera
    C4-002-A1,065030830249,4,cables
    C4-002-A3,X000OIPIT7,3,cable
    C4-002-A4,639277139221,5,cups
    C4-002-B1,065030841016,4,Usb Cables
    C4-002-B3,065030841016,4,cable
    C4-002-B4,639277337801,2,Vanilla Candle
    C4-002-C2,X002E9UXQ7,4,USB adapters
    C4-002-C3,X003S12NXL,1,cords
    C4-002-C4,047495210019,2,Blueberry Bars
    C4-003-A3,072579012012,3,beans
    C4-003-A1,065030828130,2,micro usb
    C4-003-A6,016000612709,6,Bugles
    C4-003-B2,X002YDGY75,3,usb-c cable
    C4-003-B3,870223001951,2,Coconut Lotion
    C4-003-B6,074026908886,3,oats
    C4-003-C1,013300604410,2,Devil Food Chocolate cake
    C4-003-C5,854147004687,2,Compostable Forks
    C5-001-A1,878106003573,1,Candle (Angel)
    C5-001-A2,878106003528,1,Candle (Mary)
    C5-001-A3,878106003535,1,Candle (Jesus)
    C5-001-A4,639277423320,1,Laundry Detergent
    C5-001-A5,016000416604,2,Mashed Potatoes Mix
    C5-001-A6,639277655509,2,Napkins
    C5-001-B1,079100532667,2,Dog Bones
    C5-001-B2,195464076651,1,ear buds
    C5-001-B3,831527005113,1,eye drops
    C5-001-B4,072486002205,2,corn muffin mix
    C5-001-B5,086106072004,3,Saltines
    C5-001-B6,042400214434,2,tootie fruities cereal
    C5-001-C1,639277691347,1,plastic wrap
    C5-001-C2,017714001018,1,Aspirin
    C5-001-C3,639277294050,2,earplugs
    C5-001-C4,029900212603,1,Trashbags
    C5-001-C5,X002TWAQTN,1,Power Monitor
    C5-001-C6,037000527695,4,Charmin Toilet Paper
    C5-002-A1,098487954862,1,Penne Rigate Pasta
    C5-002-A2,098487954947,1,Spaghetti Pasta
    C5-002-A3,098487954909,1,Small Elbows Pasta
    C5-002-A4,040000422082,2,Musketeer Candy
    C5-002-A5,042400136262,2,Golden Puffs
    C5-002-A6,190569351122,2,Sliced Potatoes
    C5-002-B1,051000212245,2,spagettios
    C5-002-B2,051000000163,2,soup
    C5-002-B3,078883760229,2,canned jalapeño
    C5-002-B4,013300602355,2,cake mix
    C5-002-B5,072320110110,3,animal crackers
    C5-002-B6,041789001116,4,lime chili chicken noodles
    C5-002-C1,059642164007,500,gum
    C5-002-C2,071082100698,6,cookies
    C5-002-C3,030100773986,8,cookies
    C5-002-C4,047495210040,2,Raspberry Fig Bar
    C5-002-C5,047495210026,2,Original Fig Bar
    C5-002-C6,047495210019,1,Blueberry fig bar
    C5-003-A1,098487955210,3,Cream of Mushroom soup
    C5-003-A2,076828047237,1,Wet Ones Sanitizing Wipes
    C5-003-A3,037466014005,2,Lindor Chocolate
    C5-003-A4,071082100681,3,E.L. Fudge Elfwich
    C5-003-A5,047495117813,24,Nature Valley Original Fig
    C5-003-A6,043152031263,2,Multipurpose Cleaner
    C5-003-B1,754918382603,2,Butter Toffee popcorn
    C5-003-B2,639277157249,2,Sandwich bags
    C5-003-B3,041501009451,1,Taco Shells
    C5-003-B4,052000122510,8,Gatorade Glacier freeze
    C5-003-B5,052000122510,15,Gatorade Glacier Freeze
    C5-003-B6,052000043396,13,Gatorade Glacier Cherry
    C5-003-C1,028400040112,7,Cheetos
    C5-003-C2,028400090896,4,Doritos
    C5-003-C3,072392015511,2,Sonic Gelatin
    C5-003-C4,041501100288,2,Red Chile Sauce
    C5-003-C5,028800130536,2,Kidney Beans
    C5-003-C6,647878245869,1,Enchilada Sauce
    C5-004-A1,834576005875,3,Body Lotion
    C5-004-A2,827854015406,2,Dish Grease & Stain Remover
    C5-004-A3,839294002519,3,Mouthwash
    C5-004-A4,639277937056,2,Bulbs
    C5-004-A5,079100528707,2,Dog Bones
    C5-004-A6,X00308BEOB,1,High Protein Snack
    C5-004-B1,839294562761,3,Conditioner
    C5-004-B2,839294603266,3,Body Wash
    C5-004-B3,849607071590,3,Dish Soap
    C5-004-B4,816559010830,1,Aloe Deodorant Bar
    C5-004-B5,070330916142,3,Silky Touch Razors
    C5-004-B6,639277498533,1,Six Men’s Razors
    C5-004-C1,875010002128,3,Bubble Bath
    C5-004-C2,722429420183,3,Laundry Detergent
    C5-004-C3,875010001756,3,Shampoo
    C5-004-C4,017000115399,1,Soap Bar
    C5-004-C5,063435891568,2,Scotties Facial Tissue
    C5-004-C6,011225003943,2,Simply White Paper Towels
    C6-001-C4,123fork456,16,Knife
    C6-001-C5,fake5678,10,badge-clip
    C6-001-C6,123spoon456,19,Fork
    C6-002-B3,X001Y366AV,6,Dan Yee cable
    C6-002-B6,041789001215,12,Ramen
    C6-002-C5,888849000234,12,Purple Protein Bar`;

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

    // For faster lookup, create a Map of UPC to item
    const itemsMap = new Map();
    items.forEach(item => {
        itemsMap.set(item.upc, item);
    });

    // Function to start the video stream
    const startVideo = async (deviceId) => {
        if (stream) {
            // Stop any existing stream
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
            });
            video.srcObject = stream;
            video.play();
        } catch (err) {
            console.error('Error accessing the camera: ', err);
            alert('Error accessing the camera.');
            return;
        }
    };

    // Function to populate the camera selector
    const populateCameraSelect = async () => {
        try {
            devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });
            // Set the current device ID to the first one
            currentDeviceId = videoDevices[0].deviceId;
            cameraSelect.value = currentDeviceId;
            await startVideo(currentDeviceId);
        } catch (err) {
            console.error('Error enumerating devices: ', err);
            alert('Error accessing video devices.');
        }
    };

    // Event listener for camera selection change
    cameraSelect.addEventListener('change', async () => {
        currentDeviceId = cameraSelect.value;
        await startVideo(currentDeviceId);
    });

    // Start scanning when the video metadata is loaded
    video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('Video metadata loaded, starting scan...');
        scanFrame();
    });

    // Keep track of the last scanned barcode to prevent duplicates
    let lastScannedCode = null;

    // Function to scan frames for barcodes
    const scanFrame = async () => {
        try {
            const barcodes = await barcodeDetector.detect(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (barcodes.length > 0) {
                for (const barcode of barcodes) {
                    // Only process if it's a new barcode
                    const scannedUPC = barcode.rawValue;
                    if (scannedUPC !== lastScannedCode) {
                        lastScannedCode = scannedUPC;

                        console.log('Barcode detected: ', barcode);
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
                            <td class="small">${description}</td>
                            <td>${location}</td>
                            <td class="small">${scannedUPC}</td>
                        `;
                        // Insert the new row at the beginning of the table body
                        scanResultsTableBody.insertBefore(newRow, scanResultsTableBody.firstChild);

                        // Optionally, stop scanning after a successful scan
                        // video.pause();
                        // stream.getTracks().forEach(track => track.stop());
                        // return;

                        // Break to avoid processing multiple barcodes in one frame
                        break;
                    }
                }
            }
            // Do not reset lastScannedCode here; wait until the barcode is out of view
        } catch (err) {
            console.error('Error detecting barcode: ', err);
            alert('Error detecting barcode.');
        }
        requestAnimationFrame(scanFrame);
    };

    // Reset lastScannedCode when the barcode is out of view for a certain period
    let barcodeOutOfViewTimeout;
    const barcodeOutOfViewDelay = 1000; // milliseconds

    const resetLastScannedCode = () => {
        lastScannedCode = null;
    };

    // Modify scanFrame to reset lastScannedCode when barcode is not detected
    const scanFrameWithReset = async () => {
        try {
            const barcodes = await barcodeDetector.detect(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (barcodes.length > 0) {
                // Clear the timeout since barcode is still in view
                clearTimeout(barcodeOutOfViewTimeout);
                for (const barcode of barcodes) {
                    // Same processing as before
                    const scannedUPC = barcode.rawValue;
                    if (scannedUPC !== lastScannedCode) {
                        lastScannedCode = scannedUPC;

                        console.log('Barcode detected: ', barcode);
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
                            <td>${description}</td>
                            <td>${location}</td>
                            <td>${scannedUPC}</td>
                        `;
                        // Insert the new row at the beginning of the table body
                        scanResultsTableBody.insertBefore(newRow, scanResultsTableBody.firstChild);

                        // Break to avoid processing multiple barcodes in one frame
                        break;
                    }
                }
            } else {
                // Start a timeout to reset lastScannedCode after the barcode is out of view
                if (lastScannedCode !== null && !barcodeOutOfViewTimeout) {
                    barcodeOutOfViewTimeout = setTimeout(() => {
                        resetLastScannedCode();
                        barcodeOutOfViewTimeout = null;
                    }, barcodeOutOfViewDelay);
                }
            }
        } catch (err) {
            console.error('Error detecting barcode: ', err);
            alert('Error detecting barcode.');
        }
        requestAnimationFrame(scanFrameWithReset);
    };

    // Use the modified scanFrameWithReset function
    await populateCameraSelect();
})();
