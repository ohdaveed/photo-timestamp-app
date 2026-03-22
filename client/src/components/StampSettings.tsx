/**
 * StampSettings — Configurable options for timestamp overlay
 * Position, format, content toggles, opacity
 */

import { StampOptions } from "@/lib/photoProcessor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface StampSettingsProps {
  options: StampOptions;
  onChange: (options: StampOptions) => void;
  isProcessing: boolean;
}

export default function StampSettings({
  options,
  onChange,
  isProcessing,
}: StampSettingsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const update = (partial: Partial<StampOptions>) => {
    onChange({ ...options, ...partial });
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <Settings2 className="w-4 h-4" />
        Stamp Settings
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 rounded-xl border bg-card space-y-5">
              {/* Row 1: Position + Font Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Position
                  </Label>
                  <Select
                    value={options.position}
                    onValueChange={(v) =>
                      update({ position: v as StampOptions["position"] })
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Font Size
                  </Label>
                  <Select
                    value={options.fontSize}
                    onValueChange={(v) =>
                      update({ fontSize: v as StampOptions["fontSize"] })
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date Format
                  </Label>
                  <Select
                    value={options.dateFormat}
                    onValueChange={(v) =>
                      update({ dateFormat: v as StampOptions["dateFormat"] })
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Time Format + Opacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Time Format
                  </Label>
                  <Select
                    value={options.timeFormat}
                    onValueChange={(v) =>
                      update({ timeFormat: v as StampOptions["timeFormat"] })
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Background Opacity
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[options.opacity * 100]}
                      onValueChange={([v]) => update({ opacity: v / 100 })}
                      min={20}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                      {Math.round(options.opacity * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Content toggles */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Content
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Switch
                      checked={options.showDate}
                      onCheckedChange={(v) => update({ showDate: v })}
                    />
                    <span className="text-sm text-foreground">Date</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Switch
                      checked={options.showTime}
                      onCheckedChange={(v) => update({ showTime: v })}
                    />
                    <span className="text-sm text-foreground">Time</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Switch
                      checked={options.showLocation}
                      onCheckedChange={(v) => update({ showLocation: v })}
                    />
                    <span className="text-sm text-foreground">Location</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Switch
                      checked={options.showCoordinates}
                      onCheckedChange={(v) => update({ showCoordinates: v })}
                    />
                    <span className="text-sm text-foreground">GPS Coords</span>
                  </label>
                </div>
              </div>

              {/* Auto-reprocess indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <svg className="w-3.5 h-3.5 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Applying changes...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
