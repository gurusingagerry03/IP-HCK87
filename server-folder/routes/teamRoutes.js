const router = require('express').Router();
const teamController = require('../controllers/teamController');
const authenticate = require('../middlewares/authenticate');
const adminOnly = require('../middlewares/adminOnly');
const multer = require('multer');

// Updated multer config for multiple files with validation
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post(
  '/sync/:leagueId',
  authenticate,
  adminOnly,
  teamController.synchronizeTeamsAndPlayersFromAPI
);
router.patch('/generate-descriptions/:id', teamController.updateTeamDescription);
// Updated route for multiple images upload (max 4 files)
router.patch(
  '/img-url/:id',
  authenticate,
  adminOnly,
  upload.array('images', 4),
  teamController.uploadImageUrlTeam
);
// Add route for deleting specific image
router.delete('/img-url/:id/:imageIndex', authenticate, adminOnly, teamController.deleteTeamImage);
module.exports = router;
