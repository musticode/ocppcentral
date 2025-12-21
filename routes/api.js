import express from "express";
import ocppHandler from "../service/ocpp/ocppHandler.js";
import authorize from "../service/ocpp/authorize.js";

const router = express.Router();

/**
 * GET /api/chargers - Get all connected charging stations
 */
router.get("/chargers", function (req, res, next) {
  try {
    const clients = ocppHandler.getAllClients();
    res.json({
      success: true,
      count: clients.length,
      chargers: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/chargers/:chargePointId - Get specific charger details
 */
router.get("/chargers/:chargePointId", function (req, res, next) {
  try {
    const { chargePointId } = req.params;
    const client = ocppHandler.getClient(chargePointId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Charger not found",
      });
    }

    // Get full client data
    const connectedClients = ocppHandler.connectedClients;
    const clientData = connectedClients.get(chargePointId);

    res.json({
      success: true,
      charger: {
        chargePointId: chargePointId,
        connectedAt: clientData.connectedAt,
        lastHeartbeat: clientData.lastHeartbeat,
        status: clientData.status,
        transactions: clientData.transactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/chargers/:chargePointId/remote-start - Remote start transaction
 */
router.post(
  "/chargers/:chargePointId/remote-start",
  async function (req, res, next) {
    try {
      const { chargePointId } = req.params;
      const { connectorId, idTag } = req.body;

      if (!connectorId || !idTag) {
        return res.status(400).json({
          success: false,
          error: "connectorId and idTag are required",
        });
      }

      const client = ocppHandler.getClient(chargePointId);

      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Charger not found or not connected",
        });
      }

      // Send RemoteStartTransaction request
      const response = await client.call("RemoteStartTransaction", {
        connectorId: connectorId,
        idTag: idTag,
      });

      res.json({
        success: true,
        response: response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/chargers/:chargePointId/remote-stop - Remote stop transaction
 */
router.post(
  "/chargers/:chargePointId/remote-stop",
  async function (req, res, next) {
    try {
      const { chargePointId } = req.params;
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: "transactionId is required",
        });
      }

      const client = ocppHandler.getClient(chargePointId);

      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Charger not found or not connected",
        });
      }

      // Send RemoteStopTransaction request
      const response = await client.call("RemoteStopTransaction", {
        transactionId: transactionId,
      });

      res.json({
        success: true,
        response: response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/tags - Get all authorized and blocked tags
 */
router.get("/tags", function (req, res, next) {
  try {
    res.json({
      success: true,
      authorized: authorize.getAuthorizedTags(),
      blocked: authorize.getBlockedTags(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/tags/authorize - Add an authorized tag
 */
router.post("/tags/authorize", function (req, res, next) {
  try {
    const { idTag } = req.body;

    if (!idTag) {
      return res.status(400).json({
        success: false,
        error: "idTag is required",
      });
    }

    authorize.addAuthorizedTag(idTag);

    res.json({
      success: true,
      message: `Tag ${idTag} has been authorized`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/tags/block - Block a tag
 */
router.post("/tags/block", function (req, res, next) {
  try {
    const { idTag } = req.body;

    if (!idTag) {
      return res.status(400).json({
        success: false,
        error: "idTag is required",
      });
    }

    authorize.blockTag(idTag);

    res.json({
      success: true,
      message: `Tag ${idTag} has been blocked`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/tags/:idTag - Remove a tag (from authorized or blocked)
 */
router.delete("/tags/:idTag", function (req, res, next) {
  try {
    const { idTag } = req.params;

    authorize.removeAuthorizedTag(idTag);

    res.json({
      success: true,
      message: `Tag ${idTag} has been removed`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
