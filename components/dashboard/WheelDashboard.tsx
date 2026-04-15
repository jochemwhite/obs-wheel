"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";
import { clamp, truncate, uid } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { WheelItem } from "@/types";

type UserPreset = {
  id: string;
  name: string;
  items: WheelItem[];
  updatedAt: string | null;
};

function createItem(label = "", weight = 1): WheelItem {
  return { id: uid(), label, weight };
}

function sanitizeItems(items: WheelItem[]): WheelItem[] {
  return items
    .map((item) => ({
      ...item,
      label: item.label.trim(),
      weight: Number(item.weight),
    }))
    .filter((item) => item.label && Number.isFinite(item.weight) && item.weight > 0);
}

function DashboardWheelPreview({ items }: { items: WheelItem[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 8;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#12121b";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const cleanItems = sanitizeItems(items);
    if (cleanItems.length === 0) {
      ctx.fillStyle = "#6b6b88";
      ctx.font = "600 15px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Add items to preview", cx, cy);
      return;
    }

    const total = cleanItems.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = -Math.PI / 2;

    cleanItems.forEach((item, index) => {
      const arc = (item.weight / total) * Math.PI * 2;
      const endAngle = startAngle + arc;
      const mid = startAngle + arc / 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fill();

      ctx.strokeStyle = "#0d0d14";
      ctx.lineWidth = 2;
      ctx.stroke();

      const label = arc < 0.28 ? "" : arc < 0.5 ? truncate(item.label, 8) : truncate(item.label, 14);
      if (label) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(mid);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 4;
        ctx.font = `600 ${clamp(12, arc * radius * 0.33, 16)}px 'DM Sans', sans-serif`;
        ctx.fillText(label, radius * 0.62, 0);
        ctx.restore();
      }

      startAngle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0d0d14";
    ctx.stroke();
  }, [items]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[280px] h-[280px]">
        <div
          className="absolute inset-[-4px] rounded-full"
          style={{ background: "conic-gradient(#ff5f6d, #f0c040, #ff5f6d)" }}
        />
        <div className="absolute inset-[-2px] rounded-full bg-[#0d0d14]" />
        <canvas ref={canvasRef} width={280} height={280} className="relative z-10 w-full h-full rounded-full" />
        <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-20">
          <svg width="24" height="26" viewBox="0 0 24 26">
            <polygon points="12,25 0,3 24,3" fill="#f0c040" stroke="#c09000" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-[#8b8b9d]">Live preview of current wheel items</p>
    </div>
  );
}

export function WheelDashboard() {
  const labelInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [items, setItems] = useState<WheelItem[]>([]);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [presetUpdating, setPresetUpdating] = useState(false);
  const [presetDeleting, setPresetDeleting] = useState(false);
  const [spinningRemotely, setSpinningRemotely] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNewPresetDialog, setShowNewPresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [creatingPreset, setCreatingPreset] = useState(false);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const totalWeightValue = useMemo(
    () => items.reduce((sum, item) => sum + (Number.isFinite(item.weight) ? item.weight : 0), 0),
    [items]
  );
  const positiveTotalWeight = useMemo(
    () => items.reduce((sum, item) => sum + (item.weight > 0 ? item.weight : 0), 0),
    [items]
  );
  const hasSelectedUserPreset = selectedPreset.startsWith("user:");
  const isPresetActionBusy = copyingLink || spinningRemotely || presetUpdating || presetDeleting;
  const selectedPresetId = hasSelectedUserPreset ? selectedPreset.replace("user:", "") : null;
  const selectedPresetRecord = selectedPresetId ? userPresets.find((preset) => preset.id === selectedPresetId) ?? null : null;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [configRes, presetsRes] = await Promise.all([
          fetch("/api/wheel-config", { cache: "no-store" }),
          fetch("/api/wheel-presets", { cache: "no-store" }),
        ]);

        if (!configRes.ok) {
          throw new Error("Could not load wheel config");
        }

        const configData = await configRes.json();
        const presetsData = presetsRes.ok ? await presetsRes.json() : { presets: [] };

        if (active) {
          const presets = Array.isArray(presetsData.presets) ? presetsData.presets : [];
          setItems(
            Array.isArray(configData.items) && configData.items.length > 0
              ? configData.items
              : [createItem("Item 1", 1)]
          );
          setUserPresets(presets);
          setSelectedPreset(presets.length > 0 ? `user:${presets[0].id}` : "");
          setStatus(
            configData.updatedAt
              ? `Loaded saved config (${new Date(configData.updatedAt).toLocaleString()})`
              : "No saved config yet"
          );
        }
      } catch (error) {
        if (active) {
          setItems([createItem("Item 1", 1)]);
          setStatus(error instanceof Error ? error.message : "Failed to load");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pendingFocusId) return;
    const target = labelInputRefs.current[pendingFocusId];
    if (!target) return;
    target.focus();
    target.select();
    setPendingFocusId(null);
  }, [items, pendingFocusId]);

  function addItem(afterId?: string) {
    const newItem = createItem(`Item ${items.length + 1}`, 1);
    setItems((prev) => {
      if (!afterId) {
        return [...prev, newItem];
      }

      const idx = prev.findIndex((item) => item.id === afterId);
      if (idx === -1) {
        return [...prev, newItem];
      }

      const next = [...prev];
      next.splice(idx + 1, 0, newItem);
      return next;
    });
    setPendingFocusId(newItem.id);
  }

  function handlePresetSelectionChange(nextValue: string) {
    setSelectedPreset(nextValue);
    if (!nextValue.startsWith("user:")) return;

    const id = nextValue.replace("user:", "");
    const preset = userPresets.find((item) => item.id === id);
    if (!preset) return;

    setItems(preset.items.map((item) => ({ ...item, id: uid() })));
    setStatus(`Loaded preset: ${preset.name}`);
  }

  function openNewPresetDialog() {
    setNewPresetName("");
    setShowNewPresetDialog(true);
  }

  async function createPresetFromDialog() {
    const trimmedName = newPresetName.trim().slice(0, 60);

    if (!trimmedName) {
      setStatus("Enter a preset name");
      return;
    }

    setCreatingPreset(true);
    setStatus("Creating preset...");

    try {
      const res = await fetch("/api/wheel-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, items: [] }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not create preset");
      }

      const data = await res.json();
      const preset = data.preset as UserPreset | undefined;
      if (preset) {
        setUserPresets((prev) => [preset, ...prev]);
        setSelectedPreset(`user:${preset.id}`);
        setPresetName(preset.name);
        setItems([]);
      }

      setShowNewPresetDialog(false);
      setNewPresetName("");
      setStatus(`Preset created: ${trimmedName}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create preset");
    } finally {
      setCreatingPreset(false);
    }
  }

  useEffect(() => {
    if (!selectedPreset.startsWith("user:")) return;
    const id = selectedPreset.replace("user:", "");
    const preset = userPresets.find((item) => item.id === id);
    if (preset) {
      setPresetName(preset.name);
    }
  }, [selectedPreset, userPresets]);

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateLabel(id: string, label: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, label: label.slice(0, 40) } : item)));
  }

  function updateWeight(id: string, rawWeight: string) {
    const parsed = Number(rawWeight);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, weight: Number.isFinite(parsed) && parsed > 0 ? parsed : 0 } : item
      )
    );
  }

  function handleItemKeyDown(event: React.KeyboardEvent<HTMLInputElement>, itemId: string) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addItem(itemId);
  }

  async function saveConfig() {
    const cleaned = sanitizeItems(items);

    if (cleaned.length === 0) {
      setStatus("Add at least one valid item before saving");
      return;
    }

    setSaving(true);
    setStatus("Saving wheel and preset...");

    try {
      const configRes = await fetch("/api/wheel-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cleaned }),
      });

      if (!configRes.ok) {
        const payload = await configRes.json().catch(() => null);
        throw new Error(payload?.error ?? "Save failed");
      }

      let presetMessage = "";

      if (hasSelectedUserPreset) {
        const presetId = selectedPreset.replace("user:", "");
        const existingPreset = userPresets.find((preset) => preset.id === presetId);
        const trimmedName = presetName.trim().slice(0, 60) || existingPreset?.name || "Untitled preset";

        const presetRes = await fetch(`/api/wheel-presets/${presetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            items: cleaned,
          }),
        });

        if (!presetRes.ok) {
          const payload = await presetRes.json().catch(() => null);
          throw new Error(payload?.error ?? "Wheel saved, but preset update failed");
        }

        const presetData = await presetRes.json();
        const updatedPreset = presetData.preset as UserPreset | undefined;
        if (updatedPreset) {
          setUserPresets((prev) => prev.map((preset) => (preset.id === updatedPreset.id ? updatedPreset : preset)));
          setPresetName(updatedPreset.name);
          presetMessage = `Updated preset: ${updatedPreset.name}`;
        }
      } else {
        const typedName = presetName.trim().slice(0, 60);
        const generatedName = `Preset ${userPresets.length + 1}`;
        const nextPresetName = typedName || generatedName;

        const presetRes = await fetch("/api/wheel-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextPresetName, items: cleaned }),
        });

        if (!presetRes.ok) {
          const payload = await presetRes.json().catch(() => null);
          throw new Error(payload?.error ?? "Wheel saved, but preset creation failed");
        }

        const presetData = await presetRes.json();
        const createdPreset = presetData.preset as UserPreset | undefined;
        if (createdPreset) {
          setUserPresets((prev) => [createdPreset, ...prev]);
          setSelectedPreset(`user:${createdPreset.id}`);
          setPresetName(createdPreset.name);
          presetMessage = `Created preset: ${createdPreset.name}`;
        }
      }

      setItems(cleaned);
      const itemLabel = `${cleaned.length} item${cleaned.length === 1 ? "" : "s"}`;
      setStatus(presetMessage ? `Saved ${itemLabel}. ${presetMessage}` : `Saved ${itemLabel}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedPreset() {
    if (!selectedPreset.startsWith("user:")) {
      setStatus("Select one of your saved presets to delete");
      return;
    }

    const id = selectedPreset.replace("user:", "");
    const target = userPresets.find((preset) => preset.id === id);
    if (!target) return;

    if (!confirm(`Delete preset "${target.name}"?`)) {
      return;
    }

    setPresetDeleting(true);
    setStatus("Deleting preset...");

    try {
      const res = await fetch(`/api/wheel-presets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not delete preset");
      }

      setUserPresets((prev) => prev.filter((preset) => preset.id !== id));
      setSelectedPreset((prev) => {
        if (prev !== `user:${id}`) return prev;
        const remaining = userPresets.filter((preset) => preset.id !== id);
        return remaining.length > 0 ? `user:${remaining[0].id}` : "";
      });
      setStatus(`Deleted preset: ${target.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete preset");
    } finally {
      setPresetDeleting(false);
    }
  }

  async function updateSelectedPreset() {
    if (!selectedPreset.startsWith("user:")) {
      setStatus("Select one of your saved presets to update");
      return;
    }

    const id = selectedPreset.replace("user:", "");
    const target = userPresets.find((preset) => preset.id === id);
    if (!target) return;

    const cleaned = sanitizeItems(items);
    const trimmedName = presetName.trim().slice(0, 60) || target.name;

    if (cleaned.length === 0) {
      setStatus("Add at least one valid item before updating a preset");
      return;
    }

    setPresetUpdating(true);
    setStatus("Updating preset...");

    try {
      const res = await fetch(`/api/wheel-presets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          items: cleaned,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not update preset");
      }

      const data = await res.json();
      const updated = data.preset as UserPreset | undefined;
      if (updated) {
        setUserPresets((prev) => prev.map((preset) => (preset.id === updated.id ? updated : preset)));
        setPresetName(updated.name);
      }
      setStatus(`Updated preset: ${trimmedName}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update preset");
    } finally {
      setPresetUpdating(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    setStatus("Signing out...");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      window.location.href = "/login";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to sign out");
      setLoggingOut(false);
    }
  }

  async function triggerRealtimeSpin() {
    if (!selectedPreset.startsWith("user:")) {
      setStatus("Select one of your saved presets to trigger it");
      return;
    }

    const presetId = selectedPreset.replace("user:", "");
    setSpinningRemotely(true);
    setStatus("Triggering wheel...");

    try {
      const res = await fetch("/api/wheel-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to trigger wheel");
      }

      setStatus("Realtime spin event sent");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to trigger wheel");
    } finally {
      setSpinningRemotely(false);
    }
  }

  async function copyObsLink() {
    if (!selectedPreset.startsWith("user:")) {
      setStatus("Select one of your saved presets to copy an OBS link");
      return;
    }

    setCopyingLink(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error("Could not resolve user for OBS link");
      }

      const presetId = selectedPreset.replace("user:", "");
      const link = `${window.location.origin}/wheel/${encodeURIComponent(user.id)}/${encodeURIComponent(presetId)}`;
      await navigator.clipboard.writeText(link);
      setStatus("OBS link copied to clipboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not copy OBS link");
    } finally {
      setCopyingLink(false);
    }
  }

  if (loading) {
    return <p className="text-[#a1a1b3]">Loading dashboard...</p>;
  }

  return (
    <section className="w-full max-w-6xl space-y-5">
      <div className="rounded-2xl border border-[#2a2a3d] bg-[#16161f] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Wheel Dashboard</h1>
            <p className="mt-1 text-sm text-[#a1a1b3]">
              Manage presets, edit slices, then save the wheel you want to run live.
            </p>
          </div>
          <Button variant="ghost" onClick={logout} disabled={loggingOut}>
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-[#2a2a3d] bg-[#12121b] p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#6b6b88]">Selected preset</span>
                <select
                  value={selectedPreset}
                  onChange={(event) => handlePresetSelectionChange(event.target.value)}
                  className="w-full rounded-lg border border-[#2a2a3d] bg-[#1e1e2e] px-3 py-2 text-sm text-[#e8e8f0] focus:border-[#f0c040] focus:outline-none"
                >
                  {userPresets.length === 0 ? (
                    <option value="">No presets yet</option>
                  ) : (
                    <optgroup label="Your Presets">
                      {userPresets.map((preset) => (
                        <option key={preset.id} value={`user:${preset.id}`}>
                          {preset.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#6b6b88]">Preset name</span>
                <Input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="Give this setup a name"
                  maxLength={60}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Button variant="ghost" onClick={openNewPresetDialog}>
                New preset
              </Button>
              <Button variant="add" onClick={saveConfig} disabled={saving}>
                {saving ? "Saving..." : "Save wheel"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-[#a1a1b3] sm:grid-cols-3">
          <p className="rounded-lg border border-[#2a2a3d] bg-[#12121b] px-3 py-2">
            Items: <strong className="text-white">{items.length}</strong>
          </p>
          <p className="rounded-lg border border-[#2a2a3d] bg-[#12121b] px-3 py-2">
            Total weight: <strong className="text-white">{totalWeightValue.toFixed(2)}</strong>
          </p>
          <p className="rounded-lg border border-[#2a2a3d] bg-[#12121b] px-3 py-2">
            Active preset: <strong className="text-white">{selectedPresetRecord?.name ?? "Draft"}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-[#2a2a3d] bg-[#12121b] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#f0c040]">Wheel Items</h2>
                <p className="text-xs text-[#a1a1b3]">Press Enter in a row to insert an item below it.</p>
              </div>
              <Button variant="ghost" onClick={() => addItem()}>
                Add item
              </Button>
            </div>

            <div className="mb-2 grid grid-cols-[1fr_110px_auto_72px] items-center gap-2 px-1 text-[11px] uppercase tracking-wide text-[#6b6b88]">
              <span>Label</span>
              <span>Weight</span>
              <span>Action</span>
              <span className="text-right">Chance</span>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_110px_auto_72px] items-center gap-2 rounded-md bg-[#171724] p-2">
                  <Input
                    ref={(el) => {
                      labelInputRefs.current[item.id] = el;
                    }}
                    value={item.label}
                    placeholder="Label"
                    maxLength={40}
                    onChange={(event) => updateLabel(item.id, event.target.value)}
                    onKeyDown={(event) => handleItemKeyDown(event, item.id)}
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.weight === 0 ? "" : item.weight}
                    placeholder="Weight"
                    onChange={(event) => updateWeight(item.id, event.target.value)}
                    onKeyDown={(event) => handleItemKeyDown(event, item.id)}
                  />
                  <Button variant="danger" onClick={() => removeItem(item.id)} disabled={items.length <= 1}>
                    Remove
                  </Button>
                  <span className="text-right text-xs text-[#a1a1b3]">
                    {item.weight > 0 && positiveTotalWeight > 0
                      ? `${((item.weight / positiveTotalWeight) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-[#2a2a3d] bg-[#12121b] p-4">
            <h2 className="text-sm font-semibold text-[#f0c040]">Live Preview</h2>
            <p className="mt-1 text-xs text-[#a1a1b3]">This is how your wheel currently looks on stream.</p>
            <div className="mt-4">
              <DashboardWheelPreview items={items} />
            </div>
          </div>

          <div className="rounded-xl border border-[#2a2a3d] bg-[#12121b] p-4">
            <h2 className="text-sm font-semibold text-[#f0c040]">Preset Actions</h2>
            <p className="mt-1 text-xs text-[#a1a1b3]">Run, share, update, or remove the selected preset.</p>
            <div className="mt-3 grid gap-2">
              <Button variant="ghost" onClick={copyObsLink} disabled={!hasSelectedUserPreset || isPresetActionBusy}>
                {copyingLink ? "Copying..." : "Copy OBS link"}
              </Button>
              <Button variant="ghost" onClick={triggerRealtimeSpin} disabled={!hasSelectedUserPreset || isPresetActionBusy}>
                {spinningRemotely ? "Triggering..." : "Trigger realtime spin"}
              </Button>
              <Button variant="ghost" onClick={updateSelectedPreset} disabled={!hasSelectedUserPreset || isPresetActionBusy}>
                {presetUpdating ? "Updating..." : "Update selected preset"}
              </Button>
              <Button variant="danger" onClick={deleteSelectedPreset} disabled={!hasSelectedUserPreset || isPresetActionBusy}>
                {presetDeleting ? "Deleting..." : "Delete selected preset"}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <p className="min-h-5 rounded-md border border-[#2a2a3d] bg-[#1b1b28] px-3 py-2 text-sm text-[#f0c040]">{status}</p>

      {showNewPresetDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#2a2a3d] bg-[#16161f] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-semibold">Create New Preset</h3>
            <p className="mt-1 text-sm text-[#a1a1b3]">Create an empty preset and start filling items after selection.</p>

            <div className="mt-4 space-y-1">
              <label htmlFor="new-preset-name" className="text-[11px] uppercase tracking-wide text-[#6b6b88]">
                Preset name
              </label>
              <Input
                id="new-preset-name"
                value={newPresetName}
                onChange={(event) => setNewPresetName(event.target.value)}
                placeholder="e.g. Weekly Viewer Picks"
                maxLength={60}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void createPresetFromDialog();
                  }
                }}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewPresetDialog(false);
                  setNewPresetName("");
                }}
                disabled={creatingPreset}
              >
                Cancel
              </Button>
              <Button variant="add" onClick={createPresetFromDialog} disabled={creatingPreset}>
                {creatingPreset ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
