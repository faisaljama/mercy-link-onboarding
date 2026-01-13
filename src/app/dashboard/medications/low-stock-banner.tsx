"use client";

import { useState } from "react";
import { AlertTriangle, Phone, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LowStockItem {
  id: string;
  medicationName: string;
  quantityRemaining: number;
  client: { firstName: string; lastName: string };
  house: { name: string };
}

interface LowStockBannerProps {
  items: LowStockItem[];
}

const GENOA_PHONE = "651-583-7097";

export function LowStockBanner({ items }: LowStockBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || items.length === 0) return null;

  const displayItems = isExpanded ? items : items.slice(0, 3);
  const hasMore = items.length > 3;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-red-800">
                Low Stock Alert: {items.length} PRN medication{items.length !== 1 ? "s" : ""} need reordering
              </h3>
            </div>

            <div className="mt-2 space-y-1">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-red-700"
                >
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    {item.quantityRemaining} left
                  </Badge>
                  <span className="font-medium">{item.medicationName}</span>
                  <span className="text-red-600">
                    - {item.client.firstName} {item.client.lastName} ({item.house.name})
                  </span>
                </div>
              ))}
            </div>

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show {items.length - 3} more
                  </>
                )}
              </Button>
            )}

            <div className="mt-3 flex items-center gap-2">
              <a
                href={`tel:${GENOA_PHONE}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Phone className="h-4 w-4" />
                Call Genoa Pharmacy: {GENOA_PHONE}
              </a>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-800 hover:bg-red-100 flex-shrink-0"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
