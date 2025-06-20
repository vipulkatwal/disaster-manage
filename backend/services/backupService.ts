// Database backup and recovery service
import { supabase } from "./supabase"
import fs from "fs"
import path from "path"

class BackupService {
  private backupDir: string

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || "./backups"
    this.ensureBackupDir()
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupFile = path.join(this.backupDir, `disaster-backup-${timestamp}.json`)

    try {
      console.log("🔄 Starting database backup...")

      // Backup all tables
      const [disasters, reports, resources, cache] = await Promise.all([
        supabase.from("disasters").select("*"),
        supabase.from("reports").select("*"),
        supabase.from("resources").select("*"),
        supabase.from("cache").select("*"),
      ])

      const backup = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          disasters: disasters.data || [],
          reports: reports.data || [],
          resources: resources.data || [],
          cache: cache.data || [],
        },
        metadata: {
          totalRecords:
            (disasters.data?.length || 0) +
            (reports.data?.length || 0) +
            (resources.data?.length || 0) +
            (cache.data?.length || 0),
        },
      }

      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))

      console.log(`✅ Backup completed: ${backupFile}`)
      console.log(`📊 Total records backed up: ${backup.metadata.totalRecords}`)

      return backupFile
    } catch (error) {
      console.error("❌ Backup failed:", error)
      throw error
    }
  }

  async restoreBackup(backupFile: string): Promise<void> {
    try {
      console.log(`🔄 Starting restore from: ${backupFile}`)

      if (!fs.existsSync(backupFile)) {
        throw new Error("Backup file not found")
      }

      const backupData = JSON.parse(fs.readFileSync(backupFile, "utf8"))

      // Clear existing data (be careful!)
      console.log("⚠️  Clearing existing data...")
      await Promise.all([
        supabase.from("reports").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("resources").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("disasters").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      ])

      // Restore data
      console.log("📥 Restoring data...")
      await Promise.all([
        backupData.data.disasters.length > 0 ? supabase.from("disasters").insert(backupData.data.disasters) : null,
        backupData.data.reports.length > 0 ? supabase.from("reports").insert(backupData.data.reports) : null,
        backupData.data.resources.length > 0 ? supabase.from("resources").insert(backupData.data.resources) : null,
      ])

      console.log(`✅ Restore completed from backup: ${backupData.timestamp}`)
      console.log(`📊 Total records restored: ${backupData.metadata.totalRecords}`)
    } catch (error) {
      console.error("❌ Restore failed:", error)
      throw error
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.backupDir)
      return files
        .filter((file) => file.startsWith("disaster-backup-") && file.endsWith(".json"))
        .sort()
        .reverse()
    } catch (error) {
      console.error("Failed to list backups:", error)
      return []
    }
  }

  async cleanOldBackups(keepCount = 10): Promise<void> {
    try {
      const backups = await this.listBackups()

      if (backups.length > keepCount) {
        const toDelete = backups.slice(keepCount)

        for (const backup of toDelete) {
          const filePath = path.join(this.backupDir, backup)
          fs.unlinkSync(filePath)
          console.log(`🗑️  Deleted old backup: ${backup}`)
        }

        console.log(`✅ Cleaned ${toDelete.length} old backups`)
      }
    } catch (error) {
      console.error("Failed to clean old backups:", error)
    }
  }

  // Schedule automatic backups
  startAutomaticBackups() {
    // Daily backup at 2 AM
    const scheduleBackup = () => {
      const now = new Date()
      const nextBackup = new Date()
      nextBackup.setHours(2, 0, 0, 0)

      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + 1)
      }

      const timeUntilBackup = nextBackup.getTime() - now.getTime()

      setTimeout(async () => {
        try {
          await this.createBackup()
          await this.cleanOldBackups(7) // Keep 7 days of backups
        } catch (error) {
          console.error("Automatic backup failed:", error)
        }

        // Schedule next backup
        scheduleBackup()
      }, timeUntilBackup)

      console.log(`📅 Next automatic backup scheduled for: ${nextBackup.toISOString()}`)
    }

    scheduleBackup()
  }
}

export const backupService = new BackupService()

// Start automatic backups
backupService.startAutomaticBackups()
