import CentralSystemService from "./centralSystemService";
import express from "express";

const router = express.Router();

function sendRemoteRequest(chargePointId) {
    //return CentralSystemService.call(chargePointId, action, params);
    return CentralSystemService.clearCache(chargePointId);
}

router.post("/sendRemoteRequest", async (req, res) => {
    const { chargePointId } = req.body;
    console.log(chargePointId);
    const result = await sendRemoteRequest(chargePointId);
    res.json(result);
});

export default router;