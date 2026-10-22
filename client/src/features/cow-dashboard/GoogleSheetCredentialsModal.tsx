import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Database, 
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface GoogleSheetCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpointRow: number;
  totalSyncedRows: number;
  lastSyncTimestamp: string;
  onSaveConfig: (config: any) => Promise<void>;
  onTriggerSync: () => Promise<void>;
  onResetData: () => Promise<void>;
}

export function GoogleSheetCredentialsModal({
  open,
  onOpenChange,
  checkpointRow,
  totalSyncedRows,
  lastSyncTimestamp,
  onSaveConfig,
  onTriggerSync,
  onResetData,
}: GoogleSheetCredentialsModalProps) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [clientEmail, setClientEmail] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"fields" | "json">("fields");
  const [copied, setCopied] = useState(false);

  // Fetch current config on open
  useEffect(() => {
    if (open) {
      apiClient<any>("/cattle/checkpoint")
        .then((data) => {
          if (data?.config?.spreadsheetId) {
            setSpreadsheetId(data.config.spreadsheetId);
          }
          if (data?.config?.sheetName) {
            setSheetName(data.config.sheetName);
          }
          if (data?.config?.clientEmail) {
            setClientEmail(data.config.clientEmail);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSave = async () => {
    if (!spreadsheetId.trim()) {
      toast.error("Please enter your Google Spreadsheet ID or URL");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveConfig({
        spreadsheetId,
        sheetName,
        clientEmail: activeTab === "fields" ? clientEmail : undefined,
        privateKey: activeTab === "fields" ? privateKey : undefined,
        credentialsJson: activeTab === "json" ? credentialsJson : undefined,
      });
      toast.success("Google Sheet credentials & checkpoint config saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await onTriggerSync();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#990000]">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/60">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Restricted Google Sheet Connection & Checkpoint
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure Google Service Account credentials to authenticate and incrementally sync your private sheet
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Checkpoint Status Banner */}
        <div className="p-3 rounded-lg bg-muted/60 border border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-muted-foreground font-medium">Checkpoint Pointer:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono bg-background text-[#990000] font-black border-red-300">
                Row #{checkpointRow}
              </Badge>
              <span className="text-muted-foreground">({totalSyncedRows} rows stored in DB)</span>
            </div>
          </div>

          <div className="space-y-0.5 text-right">
            <span className="text-muted-foreground font-medium">Last Synced:</span>
            <p className="font-mono text-foreground font-semibold">
              {lastSyncTimestamp || "Never"}
            </p>
          </div>

          <div className="w-full text-[11px] text-muted-foreground/90 border-t border-border/40 pt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Incremental Fetch Guarantee:</strong> Next sync will query only range <code>{sheetName}!A{checkpointRow + 1}:I</code> to prevent duplicate fetching!
            </span>
          </div>
        </div>

        {/* Quick Instructions Step Guide */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
          <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            How to allow CowManager access to your Restricted Google Sheet:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
            <li>Open your Google Sheet in browser and click the green <strong>"Share"</strong> button.</li>
            <li>Add your Google Cloud <strong>Service Account Email</strong> (e.g. <code>my-service-account@project-id.iam.gserviceaccount.com</code>) with <strong>Viewer</strong> role.</li>
            <li>Copy the Spreadsheet ID from the URL (between <code>/d/</code> and <code>/edit</code>) and paste below.</li>
            <li>Paste your Service Account credentials (client email &amp; private key, or JSON file content).</li>
          </ol>
        </div>

        {/* Input Form */}
        <div className="space-y-4 pt-2">
          {/* Spreadsheet ID / URL */}
          <div className="space-y-1.5">
            <Label htmlFor="sheetId" className="text-xs font-bold">
              Google Spreadsheet ID or Full URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sheetId"
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or paste https://docs.google.com/..."
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Paste either the raw ID or the full browser link; the system automatically extracts the ID.
            </p>
          </div>

          {/* Sheet Tab Name */}
          <div className="space-y-1.5">
            <Label htmlFor="sheetTab" className="text-xs font-bold">
              Sheet Tab Name
            </Label>
            <Input
              id="sheetTab"
              placeholder="e.g. Sheet1"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Credentials Mode Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Service Account Credentials</Label>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("fields")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    activeTab === "fields" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Fields
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("json")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    activeTab === "json" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Paste JSON
                </button>
              </div>
            </div>

            {activeTab === "fields" ? (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="space-y-1">
                  <Label htmlFor="clientEmail" className="text-[11px] font-semibold">
                    Service Account Client Email
                  </Label>
                  <Input
                    id="clientEmail"
                    placeholder="e.g. cow-tracker@my-project.iam.gserviceaccount.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="privateKey" className="text-[11px] font-semibold">
                    Private Key (PEM format)
                  </Label>
                  <Textarea
                    id="privateKey"
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwgg...&#10;-----END PRIVATE KEY-----"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    rows={4}
                    className="font-mono text-[10px]"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Can also be provided via <code>GOOGLE_PRIVATE_KEY</code> in <code>.env</code>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg border border-border/50">
                <Label htmlFor="credentialsJson" className="text-[11px] font-semibold">
                  Paste entire Service Account JSON file
                </Label>
                <Textarea
                  id="credentialsJson"
                  placeholder='{"type": "service_account", "project_id": "...", "private_key_id": "...", "private_key": "...", "client_email": "..."}'
                  value={credentialsJson}
                  onChange={(e) => setCredentialsJson(e.target.value)}
                  rows={6}
                  className="font-mono text-[10px]"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetData}
            className="text-xs text-muted-foreground hover:text-red-600"
          >
            Reset to Reference Seed Data
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Test & Sync"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs bg-[#990000] text-white hover:bg-[#800000] font-bold"
            >
              {isSaving ? "Saving..." : "Save Credentials"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
