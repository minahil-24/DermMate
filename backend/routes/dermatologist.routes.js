const express = require('express');
const router = express.Router();
const dermatologistController = require('../controllers/DermatologistController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (anyone can see/search profiles)
router.get('/', dermatologistController.getProfiles);
router.get('/search', dermatologistController.searchProfiles);
router.get('/:id', dermatologistController.getProfileById);

// Protected routes (Only authenticated dermatologists)
router.post('/profile',
    auth(['dermatologist']),
    upload.fields([
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'certifications', maxCount: 10 }
    ]),
    dermatologistController.createProfile
);

router.put('/:id',
    auth(['dermatologist', 'admin']),
    upload.fields([
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'certifications', maxCount: 10 }
    ]),
    dermatologistController.updateProfile
);

router.delete('/:id',
    auth(['dermatologist', 'admin']),
    dermatologistController.deleteProfile
);

module.exports = router;
