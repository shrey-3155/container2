const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const csvParser = require('csv-parser'); 
const fs = require('fs');
const { log } = require('console');
const PORT = 6002;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Persistent storage path
const PERSISTENT_STORAGE_PATH = '/shrey_PV_dir';

console.log("Testing final for video");

app.listen(PORT, () => {
    console.log(`Container 2 is listening on port ${PORT}`);
});

const cleanKey = (key) => key.trim().replace(/^['"]+|['"]+$/g, '');

// POST endpoint to sum product amounts
app.post('/sum', async (req, res) => {
    const inputData = req.body;
    const { file, data } = req.body;

    if (!inputData || !inputData.file || !inputData.product) {
        return res.json({
            file: null,
            error: "Invalid JSON input."
        });
    }

    const { file: fileName, product: productDetails } = inputData;
    const filePath = path.join(PERSISTENT_STORAGE_PATH, fileName);
    // const filePath = path.resolve(__dirname, '../data', file);

    let productSum = 0;
    let csvFormatValid = true;
    const productsArray = [];

    try {
        const stream = fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                // Normalize the keys of each row
                const cleanedRow = {};
                for (const [key, value] of Object.entries(row)) {
                    cleanedRow[cleanKey(key)] = value.trim();
                }

                if (cleanedRow.product === productDetails) {
                    productSum += parseInt(cleanedRow.amount, 10);
                }

                // Check if mandatory fields are missing
                if (cleanedRow.product === undefined || cleanedRow.amount === undefined) {
                    csvFormatValid = false;
                }

                productsArray.push(cleanedRow);
            });

        stream.on('end', () => {
            if (!csvFormatValid) {
                return res.json({
                    file: fileName,
                    error: "Input file not in CSV format."
                });
            }

            if (productsArray.length === 0) {
                return res.json({
                    file: fileName,
                    error: "Input file not in CSV format."
                });
            }

            return res.json({
                file: fileName,
                sum: productSum
            });
        });

        stream.on('error', (error) => {
            console.error("Error parsing input file -> ", error);
            return res.json({
                file: fileName,
                error: "Error parsing input file."
            });
        });
    } catch (error) {
        console.error("Error -> ", error);
        return res.json({
            file: fileName,
            error: "Error processing the request."
        });
    }
});
