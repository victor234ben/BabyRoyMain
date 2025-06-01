const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { verifyTelegram, connectWallet, verifyInvite } = require('../controllers/verifyTaskController')

const router = express.Router()
router.use(protect)

router.post('/tasks/verify/telegram', verifyTelegram)
router.post('/tasks/verify/connect', connectWallet)
router.post('/tasks/verify/inviteFriends', verifyInvite)

module.exports = router