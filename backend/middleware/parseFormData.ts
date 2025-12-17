/**
 * Middleware to parse JSON fields from FormData
 * When using multipart/form-data, nested objects need to be sent as JSON strings
 * This middleware parses them back to objects before validation
 */
export const parseFormDataJson = (req: any, res: any, next: any) => {
    try {
        console.log('Parsing FormData - Original body:', req.body);
        console.log('=== PARSE FORMDATA DEBUG ===');
        console.log('req.body:', JSON.stringify(req.body, null, 2));
        console.log('req.files:', req.files);
        console.log('Keys in req.body:', Object.keys(req.body || {}));
        console.log('========================');

        // Parse location field if it exists as a string
        if (req.body.location && typeof req.body.location === 'string') {
            try {
                req.body.location = JSON.parse(req.body.location);
                console.log('Parsed location:', req.body.location);
            } catch (e) {
                console.error('Error parsing location:', e);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid location format'
                });
            }
        }

        // Convert string boolean to actual boolean
        if (req.body.openToCollaboration !== undefined) {
            req.body.openToCollaboration = req.body.openToCollaboration === 'true';
        }

        console.log('After parsing - body:', req.body);
        next();
    } catch (error) {
        console.error('Error in parseFormDataJson:', error);
        return res.status(400).json({
            success: false,
            message: 'Error parsing form data'
        });
    }
};
