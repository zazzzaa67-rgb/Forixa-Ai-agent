import "dotenv/config";
import express from "express";
import cors from "cors";
import supabase from "./database/supabase.js";
import agentRoutes from "./routes/agentRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
// import "./jobs/followUpJob.js";
// import "./jobs/emailReplyJob.js";
// import "./campaign/outreachDispatcher.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.json({
        message: "AI Sales Agent is running 🚀"
    });
});
app.get("/test-db", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("leads")
            .select("*")
            .limit(5);
        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }
        res.json({
            success: true,
            leads: data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Database connection failed"
        });
    }
});
app.use("/api/agent", agentRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/whatsapp", whatsappRoutes);
const PORT = process.env.PORT || 5000;
export default app