import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../db/client";
import { admins } from "../db/schema";

async function main() {
  const [, , usernameArg, passwordArg] = process.argv;

  if (!usernameArg || !passwordArg) {
    console.error("Usage: tsx src/scripts/seed-admin.ts <username> <password>");
    process.exit(1);
  }

  const username = usernameArg;
  const password = passwordArg;

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(admins).values({
    username,
    passwordHash,
    role: "SUPER_ADMIN"
  });

  console.log(`Super admin created: ${username}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
