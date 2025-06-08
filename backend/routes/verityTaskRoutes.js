const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { verifyTelegram, connectWallet, verifyInvite, completeOnboarding } = require('../controllers/verifyTaskController')

const router = express.Router()
router.use(protect)

router.post('/tasks/verify/telegram', verifyTelegram)
router.post('/tasks/verify/connect', connectWallet)
router.post('/tasks/verify/invite', verifyInvite)
router.post('/tasks/verify/completeOnboarding', completeOnboarding)

module.exports = router