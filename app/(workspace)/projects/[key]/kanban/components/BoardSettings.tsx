"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Palette,
  Tag,
  Archive,
  Activity,
  Upload,
  Image,
  Sparkles,
  X,
  RotateCcw,
  Trash2,
  Sunset,
} from "lucide-react";
import {
  Label,
  BoardBackground,
  Activity as ActivityType,
  Card,
} from "@/types/board";

// More vibrant gradients matching Trello style
const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #D4E5F7 36%, #A8C8EE 54%)",
  "linear-gradient(135deg, #FDC830 15%, #F37335 60%)",
  "linear-gradient(135deg, #4A148C 30%, #7B1FA2 70%)",
  "linear-gradient(135deg, #1B2A6B 0%, #7B3FA0 50%, #C060B0 100%)",
  "linear-gradient(135deg, #8B5BB5 36%, #C868C0 49%)",
  "linear-gradient(135deg, #E85080 24%, #E87060 48%)",
  "linear-gradient(135deg, #2A9B78 42%, #4DC4A0 48%)",
  "linear-gradient(135deg, #283C58 64%, #374E6A 25%)",
  "linear-gradient(135deg, #5C1A0A 28%, #B83018 72%)",
  "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)",
  "linear-gradient(135deg, #360033 0%, #7B2D8B 50%, #0B8793 100%)",
  "linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)",
  "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
  "linear-gradient(135deg, #C94B4B 0%, #4B134F 100%)",
  "linear-gradient(135deg, #2980B9 0%, #6DD5FA 50%, #FFFFFF 100%)",
  "linear-gradient(135deg, #134E5E 0%, #71B280 100%)",
  "linear-gradient(135deg, #373B44 0%, #4286F4 100%)",
  "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
  "linear-gradient(135deg, #134E5E 20%, #71B280 80%)",
  "linear-gradient(135deg, #FF9A9E 10%, #FAD0C4 50%, #FAD0C4 100%)",
  "linear-gradient(135deg, #642B73 0%, #C6426E 50%, #FF6B6B 100%)",
  "linear-gradient(135deg, #000000 25%, #434343 75%)",
  "linear-gradient(135deg, #E0FFFF 10%, #00CED1 90%)",
];

// Pastel board colors (95% lightness) + white default
const COLOR_PRESETS = [
  "#FFFFFF", // White (Default)
  "#E3F2FD", // Pastel Blue
  "#FFF3E0", // Pastel Orange
  "#FFEBEE", // Pastel Pink
  "#F3E5F5", // Pastel Lavender
  "#E8F5E9", // Pastel Green
  "#FCE4EC", // Pastel Rose
  "#E1F5FE", // Pastel Sky
  "#B3E5FC", // Pastel Light Blue
  "#ECEFF1", // Pastel Gray
  "#FFF8E1", // Pastel Amber
  "#EDE7F6", // Pastel Purple
  "#DCEDC8", // Pastel Sage
  "#FFECB3", // Pastel Yellow
  "#FFCCBC", // Pastel Apricot
  "#C8E6C9", // Pastel Mint
  "#FFFDE7", // Pastel Cream
  "#B2EBF2", // Pastel Cyan
  "#D1C4E9", // Pastel Violet
  "#CFD8DC", // Pastel Blue Gray
  "#F0F4C3", // Pastel Lime
  "#B2DFDB", // Pastel Teal
  "#FFD54F", // Pastel Mustard
  "#81C784", // Pastel Moss
  "#4DB6AC", // Pastel Seafoam
  "#F48FB1", // Pastel Cherry
  "#CE93D8", // Pastel Lilac
  "#FFAB91", // Pastel Salmon
  "#A5D6A7", // Pastel Fern
  "#BCAAA4", // Pastel Taupe
  "#90A4AE", // Pastel Slate
  "#AED581", // Pastel Kiwi
  "#80CBC4", // Pastel Aquamarine
  "#FF8A65", // Pastel Coral
  "#BA68C8", // Pastel Orchid
  "#F06292", // Pastel Hot Pink
  "#9575CD", // Pastel Periwinkle
  "#7986CB", // Pastel Iris
  "#64B5F6", // Pastel Azure
  "#4FC3F7", // Pastel Electric Blue
  "#4DD0E1", // Pastel Turquoise
];

interface BoardSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  background: BoardBackground;
  onBackgroundChange: (background: BoardBackground) => void;
  labels: Label[];
  onAddLabel: (name: string, color: string) => void;
  onUpdateLabel: (id: string, name: string, color: string) => void;
  onDeleteLabel: (id: string) => void;
  archivedCards: Record<string, Card>;
  onRestoreCard: (cardId: string) => void;
  onDeleteArchivedCard: (cardId: string) => void;
  activities: ActivityType[];
}

export function BoardSettings({
  open,
  onOpenChange,
  background,
  onBackgroundChange,
  labels,
  onAddLabel,
  onUpdateLabel,
  onDeleteLabel,
  archivedCards,
  onRestoreCard,
  onDeleteArchivedCard,
  activities,
}: BoardSettingsProps) {
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("0 84% 60%");
  const [bgType, setBgType] = useState<"color" | "image" | "gradient">(
    background.type,
  );
  const [imageUrl, setImageUrl] = useState("");

  const handleAddLabel = () => {
    if (newLabelName.trim()) {
      onAddLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-xl min-h-[65vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Board Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="background" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="background" className="gap-1.5">
              <Palette className="h-4 w-4" /> Background
            </TabsTrigger>
            <TabsTrigger value="labels" className="gap-1.5">
              <Tag className="h-4 w-4" /> Labels
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-1.5">
              <Archive className="h-4 w-4" /> Archived (
              {Object.keys(archivedCards).length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-4 w-4" /> Activity
            </TabsTrigger>
          </TabsList>

          {/* Background Tab */}
          <TabsContent value="background" className="space-y-4 min-h-[350px]">
            <div className="flex gap-2 mb-4">
              <Button
                variant={bgType === "color" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBgType("color");
                  onBackgroundChange({
                    type: "color",
                    value: COLOR_PRESETS[0],
                  });
                }}
              >
                Color
              </Button>
              <Button
                variant={bgType === "gradient" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBgType("gradient");
                  // onBackgroundChange({
                  //   type: "gradient",
                  //   value: GRADIENT_PRESETS[0],
                  // });
                }}
              >
                <Sparkles className="h-4 w-4 mr-1" /> Gradient
              </Button>
              <Button
                variant={bgType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setBgType("image")}
              >
                <Image className="h-4 w-4 mr-1" /> Image
              </Button>
            </div>

            {bgType === "color" && (
              <div>
                <p className="text-sm font-medium mb-2">Pick a color</p>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          background.value === color ? "#000" : "transparent",
                      }}
                      onClick={() =>
                        onBackgroundChange({ type: "color", value: color })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {bgType === "gradient" && (
              <div>
                <p className="text-sm font-medium mb-2">Pick a gradient</p>
                <div className="grid grid-cols-4 gap-2 overflow-y-auto overflow-x-hidden max-h-74">
                  {GRADIENT_PRESETS.map((gradient, i) => (
                    <button
                      key={i}
                      className="w-full h-16 rounded-lg border-2 hover:scale-105 transition-transform"
                      style={{
                        background: gradient,
                        borderColor:
                          background.value === gradient
                            ? "#000"
                            : "transparent",
                      }}
                      onClick={() =>
                        onBackgroundChange({
                          type: "gradient",
                          value: gradient,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {bgType === "image" && (
              <div className="space-y-3">
                <p className="text-sm font-medium mb-2">Enter image URL</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl || background.value}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onBackgroundChange({ type: "image", value: imageUrl });
                      }
                    }}
                  />
                  <Button
                    onClick={() =>
                      onBackgroundChange({ type: "image", value: imageUrl })
                    }
                  >
                    Apply
                  </Button>
                </div>
                {imageUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Preview:
                    </p>
                    <img
                      src={imageUrl}
                      alt="Background preview"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={() => setImageUrl("")}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Labels Tab */}
          <TabsContent value="labels" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
              />
              <Input
                type="color"
                className="w-12 h-10 p-1"
                value={
                  `hsl(${newLabelColor})`.startsWith("hsl(")
                    ? "#" +
                      newLabelColor
                        .split(" ")[0]
                        .replace("0", "")
                        .replace("255", "ff")
                    : "#f97316"
                }
                onChange={(e) => {
                  const hex = e.target.value;
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  const h =
                    (r / 255) * 100 * 0.3 +
                    (g / 255) * 100 * 0.59 +
                    (b / 255) * 100 * 0.11;
                  setNewLabelColor(`${Math.round(h)} 84% 60%`);
                }}
              />
              <Button onClick={handleAddLabel}>Add</Button>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <Badge
                      style={{
                        backgroundColor: `hsl(${label.color} / 0.2)`,
                        color: `hsl(${label.color})`,
                      }}
                    >
                      {label.name}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDeleteLabel(label.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Archived Tab */}
          <TabsContent value="archived">
            <ScrollArea className="h-[350px]">
              {Object.keys(archivedCards).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No archived cards
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.values(archivedCards).map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{card.title}</p>
                        {card.labels.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {card.labels.map((l) => (
                              <Badge
                                key={l.id}
                                style={{
                                  backgroundColor: `hsl(${l.color} / 0.2)`,
                                  color: `hsl(${l.color})`,
                                }}
                                className="text-xs"
                              >
                                {l.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRestoreCard(card.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" /> Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteArchivedCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ScrollArea className="h-[350px]">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-3">
                  {[...activities].reverse().map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="mt-1">
                        {activity.type === "create" && (
                          <span className="text-green-500">+</span>
                        )}
                        {activity.type === "update" && (
                          <span className="text-blue-500">~</span>
                        )}
                        {activity.type === "delete" && (
                          <span className="text-red-500">-</span>
                        )}
                        {activity.type === "move" && (
                          <span className="text-orange-500">&rarr;</span>
                        )}
                        {activity.type === "comment" && (
                          <span className="text-purple-500">#</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p>{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user} &middot;{" "}
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
