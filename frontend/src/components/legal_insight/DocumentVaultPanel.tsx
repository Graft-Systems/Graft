"use client";
import { useEffect, useState } from "react";
import api from "@/app/lib/api";

type VaultItem = {
  id: string;
  filename: string;
  doc_id: string;
  content_hash_sha256: string;
};

export default function DocumentVaultPanel() {
  const storageKey = "legal_insight_documents_global";
  const [items, setItems] = useState<VaultItem[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as VaultItem[];
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return;

    (async () => {
      const uploaded: VaultItem[] = [];
      for (const f of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", f);
        const res = await api.post("/legal-insight/documents/upload/", formData);
        const payload = res.data;
        uploaded.push({
          id: `ui_${Date.now()}_${f.name}`,
          filename: payload.filename,
          doc_id: payload.doc_id,
          content_hash_sha256: payload.content_hash_sha256,
        });
      }
      setItems((prev) => [...prev, ...uploaded]);
    })().catch(() => {
      alert("Document upload failed. Try again.");
    });
  };

  return (
    <div className="space-y-4">
      <div style={{ color: "#374151", fontSize: 13 }}>
        Upload business licenses, lab results, and label files.
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            backgroundColor: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Select files
          <input
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => onFilesSelected(e.target.files)}
          />
        </label>
        <div style={{ color: "#6b7280", fontSize: 12 }}>
          {items.length} file(s) uploaded
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, color: "#111827", fontSize: 13, marginBottom: 8 }}>
          Vault items
        </div>
        {items.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 12 }}>No files selected yet.</div>
        ) : (
          <ul className="list-disc list-inside text-sm" style={{ color: "#374151" }}>
            {items.map((it) => (
              <li key={it.id}>{it.filename}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

