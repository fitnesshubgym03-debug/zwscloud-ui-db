# ZWS Cloud VPS Configurator Overhaul - Implementation Summary

## Completed ✓

### 1. Updated Pricing Engine (`lib/pricing.ts`)
- Added `includedBandwidthTb: 10` - Free bandwidth included
- Added `hourlyMultiplier: 1.25` - Hourly billing is 25% more expensive
- Updated `calculateCustomConfigPrice()` to:
  - Calculate bandwidth overage (only charge after 10 TB)
  - Apply 25% hourly markup silently (no UI text)
  - Support `billingType` parameter ("monthly" vs "hourly")
  - Return bandwidth breakdown showing included vs paid amounts

### 2. Upgraded Storage System (`prisma/schema.prisma`)
- Converted `Product.storageGb` + `storageType` → `Product.disks` (JSON array)
- Converted `CustomConfig.storageGb` + `storageType` → `CustomConfig.disks` (JSON array)
- Each disk in array: `{ type: "nvme" | "ssd", sizeGb: number, label?: string }`
- Supports 1-5 disks per server configuration
- Created migration file: `prisma/migrations/0_multi_disk_storage/migration.sql`

### 3. Created Product Configuration Constants (`lib/product-config.ts`)
- `CONFIGURATOR_LIMITS` - CPU (1-64), RAM (2-256), Storage (4000 NVMe, 8000 SSD), Bandwidth (1-100 TB)
- `STORAGE_TYPES` - NVMe ₹0.5/GB, SSD ₹0.25/GB with max sizes
- `OPERATING_SYSTEMS` - 6 OS options with Windows +₹500/mo
- `REGIONS` - 5 geographic regions
- `BANDWIDTH_OPTIONS` - 1TB to Unmetered
- `BILLING_TERMS` - 1m, 3m, 6m, 12m, 24m with discount rates
- `PREDEFINED_VPS_PLANS` - 6 plans: Starter through Dedicated
- Helper functions: `getTotalStorageGb()`, `validateDisks()`, `getDiskLabels()`

---

## Still TODO

### Task 3: Enhance Configurator Component

**What needs to be done:**

1. **Update imports** in `components/configure/configurator.tsx`:
   ```typescript
   import { 
     CONFIGURATOR_LIMITS, 
     STORAGE_TYPES, 
     OPERATING_SYSTEMS,
     REGIONS,
     BANDWIDTH_OPTIONS,
     type DiskConfig,
     getDiskCount,
     getDiskLabels,
     validateDisks 
   } from "@/lib/product-config"
   ```

2. **Replace hardcoded values** with constants:
   - `operatingSystems` → `OPERATING_SYSTEMS.map(os => os.name)`
   - `regions` → `REGIONS.map(r => r.name)`
   - `bandwidthOptions` → `BANDWIDTH_OPTIONS`
   - CPU slider: `min={1} max={CONFIGURATOR_LIMITS.cpu.max}`
   - RAM slider: `min={2} max={CONFIGURATOR_LIMITS.ram.max}`
   - Storage slider: Use `CONFIGURATOR_LIMITS.storage[storageType]`

3. **Convert storage state to disks array**:
   ```typescript
   // Before: const [storage, setStorage] = useState<number[]>([160])
   // After:
   const [disks, setDisks] = useState<DiskConfig[]>([
     { type: "nvme", sizeGb: 160, label: "Disk 1" }
   ])
   ```

4. **Add disk management functions**:
   ```typescript
   function addDisk() {
     if (disks.length < CONFIGURATOR_LIMITS.disks.max) {
       setDisks([...disks, { 
         type: "nvme", 
         sizeGb: 160, 
         label: `Disk ${disks.length + 1}` 
       }])
     }
   }

   function removeDisk(index: number) {
     setDisks(disks.filter((_, i) => i !== index))
   }

   function updateDisk(index: number, updates: Partial<DiskConfig>) {
     const newDisks = [...disks]
     newDisks[index] = { ...newDisks[index], ...updates }
     setDisks(newDisks)
   }
   ```

5. **Update pricing calculation** to use new pricing rules:
   ```typescript
   const pricing = useMemo(() => {
     const osCharge = os.includes("Windows") ? 500 : 0
     
     // Calculate total storage cost from all disks
     const storageGb = disks.reduce((sum, d) => sum + d.sizeGb, 0)
     const storageType = disks[0]?.type || "nvme"
     
     const basePricing = calculateCustomConfigPrice(
       {
         cpuCores: cpu[0],
         ramGb: ram[0],
         storageGb,
         storageType,
         bandwidthTb: bandwidth,
       },
       undefined,
       term,
       term === 1 ? "monthly" : "monthly" // Add hourly option later
     )
   }, [cpu, ram, disks, bandwidth, os, term])
   ```

6. **Update storage section UI** to show disk management:
   - Keep NVMe/SSD radio buttons
   - Add disk cards showing each disk's size and type
   - Add "Add Disk" button (if count < max)
   - Add delete button on each disk card
   - Let users adjust individual disk sizes

7. **Update bandwidth section**:
   - Show "Included: 10 TB" badge
   - Show "Extra bandwidth: ₹100/TB" note if user selects > 10 TB
   - Keep dropdown from BANDWIDTH_OPTIONS

8. **Update summary sidebar** to show:
   - Total disks: "3 Disks" badge
   - Disk breakdown: "500GB NVMe + 1TB SSD + 500GB SSD"
   - Bandwidth status: "10TB included + 6TB extra"

---

### Task 4: Add 3 New VPS Plan Cards

**Where:** `app/page.tsx` or dedicated products component

**What needs to be added:**
- 3 new plan cards matching the existing style
- Use plans from `PREDEFINED_VPS_PLANS`: Starter, Growth, Professional, Enterprise, Ultimate, Dedicated
- Show 6 cards instead of empty space
- Each card: name, description, specs (CPU/RAM/Storage), bandwidth, price, Deploy button
- Match existing ZWS Cloud dark theme with dotted background
- Maintain responsive grid layout (1 column mobile, 3+ columns desktop)

---

### Task 5 & 6: ALREADY COMPLETED

- ✓ Prisma schema updated for multi-disk support
- ✓ Configuration constants created with admin-friendly defaults
- ✓ Migration file ready for deployment

---

## Database Deployment

```bash
# After deploying code:
pnpm prisma generate
pnpm prisma migrate deploy

# Or reset if needed (WARNING - data loss):
pnpm prisma migrate reset
```

---

## API Endpoints to Update

If you have API routes that calculate pricing or handle orders:

### `/api/payments/create`
- Receive `config.disks` instead of `config.storage` + `config.storageType`
- Use updated `calculateCustomConfigPrice()` with new parameters

### Admin API (if exists)
- Product CRUD should handle `disks` JSON array
- CustomConfig CRUD should handle `disks` JSON array

---

## Key Features Implemented

✓ **RAM**: 2GB - 256GB (was already correct)
✓ **CPU**: 1 - 64 cores (was already correct)
✓ **Storage**: Multiple disks, each 40-4000GB NVMe or 40-8000GB SSD
✓ **Bandwidth**: 10TB free included, then ₹100/TB
✓ **Hourly Billing**: Silently applies +25% markup
✓ **Scalable Architecture**: Config-driven, admin can increase limits without code changes
✓ **6 VPS Plans**: Ready in PREDEFINED_VPS_PLANS
✓ **Database Migration**: Ready for deployment

---

## File Structure

```
lib/
  ├── pricing.ts (UPDATED - new rules)
  ├── product-config.ts (NEW - constants and defaults)
prisma/
  ├── schema.prisma (UPDATED - multi-disk support)
  ├── migrations/
  │   └── 0_multi_disk_storage/ (NEW - migration script)
components/
  └── configure/
      └── configurator.tsx (TODO - update for new storage and rules)
app/
  └── page.tsx (TODO - add 3 new VPS cards)
```

---

## Testing Checklist

- [ ] Pricing calculation with 10TB bandwidth free
- [ ] Hourly rate is 25% higher than monthly equivalent
- [ ] Multiple disks added/removed correctly
- [ ] Disk size limits enforced (4000 NVMe, 8000 SSD)
- [ ] New VPS plan cards display correctly
- [ ] Mobile responsive layout maintained
- [ ] Admin can update CONFIGURATOR_LIMITS in future

---

## Next Steps

1. Update Configurator component with disk management
2. Add 3 new VPS plan cards to homepage
3. Run `pnpm build` to verify no errors
4. Deploy to Vercel
5. Run database migration: `pnpm prisma migrate deploy`
