// routes/salesRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const upload = require("../../middleware/upload");
const salesCtrl = require("../../controllers/sales/salesController");

router.use(auth.protect);
router.post("/", upload.fields([
  { name: "documents", maxCount: 5 },
]), salesCtrl.createSales);
router.get("/", salesCtrl.getSales);
router.get("/:id", salesCtrl.getSalesById);
router.put("/:id", salesCtrl.updateSalesById);
router.delete("/:id", salesCtrl.deleteSalesById);

module.exports = router;
