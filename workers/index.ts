import "./notification.worker";
import "./activity.worker";
import "./stock-check.worker";

console.log("[Workers] All workers started successfully");

process.on("SIGTERM", async () => {
  console.log("[Workers] Graceful shutdown initiated");
  process.exit(0);
});
