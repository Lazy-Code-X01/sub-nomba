"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

function extractUrl(result: Record<string, unknown>): string | null {
  for (const key of ["checkoutLink", "checkoutUrl", "url", "link", "paymentUrl", "paymentLink"]) {
    if (typeof result[key] === "string") return result[key] as string;
  }
  for (const val of Object.values(result)) {
    if (val && typeof val === "object") {
      const nested = val as Record<string, unknown>;
      for (const key of ["checkoutLink", "checkoutUrl", "url", "link"]) {
        if (typeof nested[key] === "string") return nested[key] as string;
      }
    }
  }
  return null;
}

interface Props {
  result: Record<string, unknown>;
  onClose: () => void;
}

export default function PaymentLinkModal({ result, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const url = extractUrl(result);

  function handleCopy(u: string) {
    navigator.clipboard.writeText(u).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Modal title="Payment Link" onClose={onClose}>
      {url ? (
        <div className="space-y-4">
          <p className="font-sans text-[13px] text-label-2">Share this link with the customer to collect payment.</p>
          <div className="flex items-center gap-2 p-3 bg-surface-2 border border-stroke rounded-lg">
            <span className="font-mono text-[11px] text-label flex-1 truncate">{url}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => handleCopy(url)}>
              <Copy size={12} /> {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.open(url, "_blank")}>
              <ExternalLink size={12} /> Open Link
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-sans text-[13px] text-label-2">Checkout response:</p>
          <div className="rounded-xl bg-canvas border border-stroke overflow-hidden">
            <pre className="px-4 py-4 font-mono text-[11px] text-label-2 overflow-x-auto leading-relaxed">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      )}
    </Modal>
  );
}
