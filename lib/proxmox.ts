/**
 * Proxmox VE API Integration
 *
 * Documentation: https://proxmox.com/en/proxmox-ve/
 * API Docs: https://pve.proxmox.com/pve-docs/api-viewer/
 *
 * Setup:
 * - Create API token in Proxmox: Datacenter > Permissions > API Tokens
 * - Format: <user>@<realm>!<tokenid>
 */

import crypto from "crypto"

interface ProxmoxConfig {
  host: string
  port: number
  apiToken: string // Format: user@realm!tokenid=xxxxx
}

interface CreateVMParams {
  vmid: number
  hostname: string
  node: string
  cores: number
  memory: number // in MB
  storage: number // in GB
  diskStorage?: string // storage name, default "local-lvm"
  osType?: "linux" | "windows"
  osImage?: string // cloud-init image or ISO
  ipv4?: string // e.g., "192.168.1.100/24"
  gateway?: string
  nameserver?: string
  rootPassword?: string
  sshKey?: string
}

interface VMStatus {
  vmid: number
  name: string
  status: string // "running" | "stopped" | "paused"
  node: string
  maxcpu: number
  maxmem: number
  netin?: number
  netout?: number
  uptime?: number
}

interface VMConfig {
  vmid: number
  name: string
  memory: number
  cores: number
  sockets: number
  numa: boolean
  net0?: string
  ipconfig0?: string
  ipconfig1?: string
  ide2?: string
  scsi0?: string
  rootfs?: string
  boot?: string
  bootdisk?: string
  unused?: Record<string, string>
  [key: string]: unknown
}

interface ProxmoxTask {
  id: string
  data: string
}

interface ProxmoxResponse<T> {
  data: T
}

function getConfig(): ProxmoxConfig {
  const host = process.env.PROXMOX_HOST
  const port = parseInt(process.env.PROXMOX_PORT || "8006")
  const apiToken = process.env.PROXMOX_API_TOKEN

  if (!host || !apiToken) {
    throw new Error(
      "Proxmox configuration incomplete. Set PROXMOX_HOST and PROXMOX_API_TOKEN environment variables."
    )
  }

  return { host, port, apiToken }
}

async function proxmoxRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  const config = getConfig()
  const url = `https://${config.host}:${config.port}/api2/json${endpoint}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `PVEAPIToken=${config.apiToken}`,
  }

  const options: RequestInit = {
    method,
    headers,
    // Disable SSL verification for self-signed certs in development
    // In production, use valid certificates
    ...(process.env.NODE_ENV !== "production" && {
      rejectUnauthorized: false as any,
    }),
  }

  if (body) {
    const formData = new URLSearchParams()
    Object.entries(body).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
    options.body = formData.toString()
    headers["Content-Type"] = "application/x-www-form-urlencoded"
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.errors?.join(", ") || data.error || `Proxmox API error: ${response.status}`
      )
    }

    return data as T
  } catch (error) {
    console.error("[PROXMOX] Request error:", error)
    throw error
  }
}

/**
 * Create a new VM
 */
export async function createVM(params: CreateVMParams): Promise<ProxmoxTask> {
  const payload: Record<string, unknown> = {
    vmid: params.vmid,
    name: params.hostname,
    cores: params.cores,
    memory: params.memory,
    sockets: 1,
    numa: 0,
    boot: "order=scsi0;net0",
    bootdisk: "scsi0",
    scsihw: "virtio-scsi-pci",
    // Storage configuration
    scsi0: `${params.diskStorage || "local-lvm"}:${Math.ceil(params.storage)},format=raw`,
    // Network configuration
    net0: "virtio,bridge=vmbr0",
    ipconfig0: params.ipv4
      ? `ip=${params.ipv4},gw=${params.gateway || "192.168.1.1"}`
      : "ip=dhcp",
    nameserver: params.nameserver || "8.8.8.8 8.8.4.4",
    // Cloud-init
    ide2: params.osImage || "local:cloudinit",
    // Root password
    cipassword: params.rootPassword || generateRandomPassword(),
    ciuser: "root",
    // SSH key
    ...(params.sshKey && { sshkeys: params.sshKey }),
  }

  return proxmoxRequest<ProxmoxTask>(
    "POST",
    `/nodes/${params.node}/qemu`,
    payload
  )
}

/**
 * Get VM status
 */
export async function getVMStatus(node: string, vmid: number): Promise<VMStatus> {
  return proxmoxRequest<VMStatus>("GET", `/nodes/${node}/qemu/${vmid}/status/current`)
}

/**
 * Get VM configuration
 */
export async function getVMConfig(node: string, vmid: number): Promise<VMConfig> {
  return proxmoxRequest<VMConfig>("GET", `/nodes/${node}/qemu/${vmid}/config`)
}

/**
 * Start VM
 */
export async function startVM(node: string, vmid: number): Promise<ProxmoxTask> {
  return proxmoxRequest<ProxmoxTask>(
    "POST",
    `/nodes/${node}/qemu/${vmid}/status/start`
  )
}

/**
 * Stop VM
 */
export async function stopVM(node: string, vmid: number): Promise<ProxmoxTask> {
  return proxmoxRequest<ProxmoxTask>(
    "POST",
    `/nodes/${node}/qemu/${vmid}/status/stop`
  )
}

/**
 * Reboot VM
 */
export async function rebootVM(node: string, vmid: number): Promise<ProxmoxTask> {
  return proxmoxRequest<ProxmoxTask>(
    "POST",
    `/nodes/${node}/qemu/${vmid}/status/reboot`
  )
}

/**
 * Delete VM
 */
export async function deleteVM(node: string, vmid: number): Promise<ProxmoxTask> {
  return proxmoxRequest<ProxmoxTask>(
    "DELETE",
    `/nodes/${node}/qemu/${vmid}`
  )
}

/**
 * Resize VM disk
 */
export async function resizeDisk(
  node: string,
  vmid: number,
  disk: string,
  newSize: number
): Promise<ProxmoxTask> {
  return proxmoxRequest<ProxmoxTask>(
    "PUT",
    `/nodes/${node}/qemu/${vmid}/resize`,
    {
      disk,
      size: `${newSize}G`,
    }
  )
}

/**
 * Update VM configuration
 */
export async function updateVMConfig(
  node: string,
  vmid: number,
  config: Record<string, unknown>
): Promise<void> {
  await proxmoxRequest(
    "PUT",
    `/nodes/${node}/qemu/${vmid}/config`,
    config
  )
}

/**
 * List available nodes
 */
export async function listNodes(): Promise<Array<{ node: string; status: string }>> {
  return proxmoxRequest<Array<{ node: string; status: string }>>(
    "GET",
    "/nodes"
  )
}

/**
 * Get node resources
 */
export async function getNodeResources(
  node: string
): Promise<{
  status: string
  uptime: number
  cpu: number
  maxcpu: number
  memory: number
  maxmemory: number
  swap: number
  maxswap: number
}> {
  return proxmoxRequest(
    "GET",
    `/nodes/${node}/status`
  )
}

/**
 * List all VMs on a node
 */
export async function listVMs(
  node: string
): Promise<Array<{ vmid: number; name: string; status: string }>> {
  return proxmoxRequest<Array<{ vmid: number; name: string; status: string }>>(
    "GET",
    `/nodes/${node}/qemu`
  )
}

/**
 * Get task status
 */
export async function getTaskStatus(upid: string): Promise<{
  status: string
  exitstatus: string
  starttime: number
  endtime: number
  type: string
  user: string
}> {
  // UPID format: node/pid/starttime/type/id/user
  const parts = upid.split(":")
  if (parts.length < 2) {
    throw new Error("Invalid UPID format")
  }

  const node = parts[0]
  return proxmoxRequest(
    "GET",
    `/nodes/${node}/tasks/${upid}`
  )
}

/**
 * Generate random password for VMs
 */
function generateRandomPassword(length: number = 16): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Verify Proxmox API token format
 */
export function verifyTokenFormat(token: string): boolean {
  // Format: user@realm!tokenid=xxxxx
  return /^[\w\-\.]+@[\w\-\.]+![a-zA-Z0-9\-_]+=[\w\-]+$/.test(token)
}

/**
 * Parse VMID from Proxmox response
 */
export function extractVMIdFromTask(task: ProxmoxTask): number | null {
  const match = task.data.match(/VMID: (\d+)/)
  return match ? parseInt(match[1]) : null
}
