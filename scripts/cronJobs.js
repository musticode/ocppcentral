import cron from "node-cron";
import userChargingProfileService from "../service/management/userChargingProfileService.js";

/**
 * Start all scheduled cron jobs
 */
export function startCronJobs() {
  // Daily at 02:00 AM — recalculate all active user charging profiles
  cron.schedule("0 2 * * *", async () => {
    console.log("[CronJob] Starting daily user charging profile recalculation...");
    try {
      const summary = await userChargingProfileService.recalculateAllProfiles();
      console.log("[CronJob] Daily recalculation complete:", summary);
    } catch (error) {
      console.error("[CronJob] Daily recalculation failed:", error.message);
    }
  });

  console.log("[CronJob] Scheduled: daily user charging profile recalculation at 02:00 AM");
}
