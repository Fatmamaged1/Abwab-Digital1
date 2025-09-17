// routes/salesRoutes.js
const express = require("express");
const router = express.Router();
//const auth = require("../middlewares/authMiddleware");
const salesCtrl = require("../../controllers/sales/salesController");

//router.use(auth);
router.post("/", salesCtrl.createSales);
router.get("/", salesCtrl.getSales);

module.exports = router;
