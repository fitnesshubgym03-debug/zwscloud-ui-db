import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(DATABASE_URL)

async function seedCashfreeAndUser() {
  console.log("Starting seed for Cashfree settings and dummy user...")

  // 1. Insert Cashfree credentials into admin_settings
  console.log("\n1. Adding Cashfree credentials to admin_settings...")
  
  const cashfreeSettings = [
    { key: "cashfree_app_id", value: { id: "TEST10981413b37ff0a5d17e86f47fb931418901" }, description: "Cashfree App ID" },
    { key: "cashfree_secret_key", value: { key: "cfsk_ma_test_c4874c5c9c4dcd9cfa4e83d9dca8cbdc_d25045bb" }, description: "Cashfree Secret Key" },
    { key: "cashfree_mode", value: { mode: "test" }, description: "Cashfree Mode (test/production)" },
    { key: "payment_gateway", value: { gateway: "cashfree" }, description: "Active Payment Gateway" },
  ]

  for (const setting of cashfreeSettings) {
    await sql`
      INSERT INTO admin_settings (key, value, description)
      VALUES (
        ${setting.key},
        ${JSON.stringify(setting.value)},
        ${setting.description}
      )
      ON CONFLICT (key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
    console.log(`  ✓ Added setting: ${setting.key}`)
  }

  // 2. Create dummy customer user
  console.log("\n2. Creating dummy customer user...")
  
  const existingCustomer = await sql`
    SELECT id FROM customers WHERE email = 'testuser@zws.cloud'
  `

  let customerId: string

  if (existingCustomer.length > 0) {
    console.log("  ⚠ Dummy user already exists, updating...")
    customerId = existingCustomer[0].id
    await sql`
      UPDATE customers SET
        name = 'Test User',
        phone = '+91 9876543210',
        company = 'Test Company',
        metadata = '{"country": "India", "email_verified": true}'::jsonb,
        updated_at = NOW()
      WHERE email = 'testuser@zws.cloud'
    `
  } else {
    const newCustomer = await sql`
      INSERT INTO customers (email, name, phone, company, metadata)
      VALUES (
        'testuser@zws.cloud',
        'Test User',
        '+91 9876543210',
        'Test Company',
        '{"country": "India", "email_verified": true}'::jsonb
      )
      RETURNING id
    `
    customerId = newCustomer[0].id
  }
  console.log("  ✓ Created/updated dummy user:")
  console.log("    Email: testuser@zws.cloud")
  console.log("    Name: Test User")

  // 3. Create a sample order for the dummy user
  console.log("\n3. Creating sample order...")
  
  const existingOrders = await sql`SELECT id FROM orders WHERE customer_id = ${customerId}`
  
  if (existingOrders.length === 0) {
    // Get a product first
    const products = await sql`SELECT id, price_1m FROM products WHERE is_active = true LIMIT 1`
    
    if (products.length > 0) {
      const product = products[0]
      const orderNumber = 'ORD-' + Date.now()
      const unitPrice = product.price_1m || 1560
      const taxAmount = Number(unitPrice) * 0.18
      const totalAmount = Number(unitPrice) + taxAmount

      await sql`
        INSERT INTO orders (order_number, customer_id, product_id, term_months, unit_price, quantity, subtotal, tax_amount, total_amount, status)
        VALUES (
          ${orderNumber},
          ${customerId},
          ${product.id},
          1,
          ${unitPrice},
          1,
          ${unitPrice},
          ${taxAmount},
          ${totalAmount},
          'pending'
        )
      `
      console.log(`  ✓ Created sample order: ${orderNumber}`)
    } else {
      console.log("  ⚠ No products found, skipping order creation")
    }
  } else {
    console.log("  ⚠ Sample order already exists")
  }

  // 4. Verify all settings
  console.log("\n4. Verifying settings...")
  const settings = await sql`
    SELECT key, value, description FROM admin_settings 
    WHERE key LIKE 'cashfree%' OR key = 'payment_gateway'
  `
  console.log("  Payment settings in database:")
  settings.forEach((s: { key: string; value: object; description: string }) => {
    console.log(`    - ${s.key}: ${JSON.stringify(s.value)}`)
  })

  console.log("\n✅ Seeding completed successfully!")
  console.log("\n📋 Summary:")
  console.log("  - Cashfree credentials added to admin_settings")
  console.log("  - Dummy user created (testuser@zws.cloud)")
  console.log("  - Sample order created for testing")
}

seedCashfreeAndUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err)
    process.exit(1)
  })
