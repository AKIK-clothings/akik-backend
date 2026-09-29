"use strict";
/**
 * Create the first admin account for AKIK.
 * Run ONCE after setting up the database:
 *   npm run seed:admin
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function createAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = "Hafsa Khatri";
    if (!email || !password) {
        console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first");
        process.exit(1);
    }
    console.log(`\n🔐 Creating admin account for: ${email}`);
    // Check if admin already exists
    const { data: existing } = await supabase
        .from("admins")
        .select("id")
        .eq("email", email)
        .single();
    if (existing) {
        console.log("⚠️  Admin already exists. Updating password...");
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const { error } = await supabase
            .from("admins")
            .update({ password_hash: passwordHash })
            .eq("email", email);
        if (error)
            throw error;
        console.log("✅ Password updated successfully!");
    }
    else {
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const { error } = await supabase.from("admins").insert({
            email: email.toLowerCase(),
            password_hash: passwordHash,
            name,
            role: "superadmin",
        });
        if (error)
            throw error;
        console.log(`✅ Admin created successfully!`);
    }
    console.log(`\n📝 Admin Credentials:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   URL:      https://your-frontend.vercel.app/admin/login\n`);
    process.exit(0);
}
createAdmin().catch((err) => {
    console.error("Admin creation failed:", err);
    process.exit(1);
});
