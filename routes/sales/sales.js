// routes/salesRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const salesCtrl = require("../../controllers/sales/salesController");

router.use(auth.protect);
router.post("/", salesCtrl.createSales);
router.get("/", salesCtrl.getSales);

module.exports = router;
