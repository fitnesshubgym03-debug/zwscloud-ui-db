import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "admin@example.com"
  const password = "AdminPassword123!"

  console.log("[FIX] Fixing admin password...")
  console.log("[FIX] Email:", email)
  console.log("[FIX] Password:", password)

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log("[FIX] Hashed password:", hashedPassword)

  // Update the admin user
  const admin = await prisma.adminProfile.update({
    where: { email },
    data: {
      hashedPassword: hashedPassword,
    },
  })

  console.log("[FIX] Admin password updated successfully!")
  console.log("[FIX] Admin:", {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
  })

  // Verify by comparing
  const isValid = await bcrypt.compare(password, admin.hashedPassword)
  console.log("[FIX] Password verification:", isValid ? "✓ VALID" : "✗ INVALID")
}

main()
  .catch((error) => {
    console.error("[FIX] Error:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
