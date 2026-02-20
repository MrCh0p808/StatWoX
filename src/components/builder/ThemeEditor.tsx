"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Type, Image, RotateCcw } from "lucide-react";
import type { SurveyTheme } from "@/types";

const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Outfit', label: 'Outfit' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Space Grotesk', label: 'Space Grotesk' },
    { value: 'DM Sans', label: 'DM Sans' },
    { value: 'system-ui', label: 'System Default' },
];

const PRESET_THEMES: Record<string, SurveyTheme> = {
    midnight: { primaryColor: '#00d4ff', backgroundColor: '#0a0a1a', textColor: '#e4e4e7', fontFamily: 'Inter', borderRadius: '12px' },
    forest: { primaryColor: '#00ff88', backgroundColor: '#0d1f0d', textColor: '#d4e8d4', fontFamily: 'DM Sans', borderRadius: '8px' },
    sunset: { primaryColor: '#ff6b6b', backgroundColor: '#1a0a0a', textColor: '#ffd4d4', fontFamily: 'Poppins', borderRadius: '16px' },
    ocean: { primaryColor: '#6c5ce7', backgroundColor: '#0a0a2e', textColor: '#d4d4ff', fontFamily: 'Space Grotesk', borderRadius: '12px' },
    clean: { primaryColor: '#2563eb', backgroundColor: '#ffffff', textColor: '#1e293b', fontFamily: 'Inter', borderRadius: '8px' },
};

interface ThemeEditorProps {
    value: SurveyTheme | null;
    onChange: (theme: SurveyTheme) => void;
}

export function ThemeEditor({ value, onChange }: ThemeEditorProps) {
    const theme = value || PRESET_THEMES.midnight;

    const update = (field: keyof SurveyTheme, val: string) => {
        onChange({ ...theme, [field]: val });
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Survey Theme
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Presets */}
                <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Presets</Label>
                    <div className="flex gap-2 flex-wrap">
                        {Object.entries(PRESET_THEMES).map(([name, preset]) => (
                            <button key={name} onClick={() => onChange(preset)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-border/50 hover:border-primary/50 transition-colors capitalize"
                                style={{ backgroundColor: preset.backgroundColor, color: preset.textColor }}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Primary</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={theme.primaryColor} onChange={(e) => update('primaryColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-0" />
                            <Input value={theme.primaryColor} onChange={(e) => update('primaryColor', e.target.value)}
                                className="h-8 text-xs font-mono" />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Background</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={theme.backgroundColor} onChange={(e) => update('backgroundColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-0" />
                            <Input value={theme.backgroundColor} onChange={(e) => update('backgroundColor', e.target.value)}
                                className="h-8 text-xs font-mono" />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Text</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={theme.textColor} onChange={(e) => update('textColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-0" />
                            <Input value={theme.textColor} onChange={(e) => update('textColor', e.target.value)}
                                className="h-8 text-xs font-mono" />
                        </div>
                    </div>
                </div>

                {/* Font */}
                <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Type className="h-3 w-3" /> Font Family
                    </Label>
                    <Select value={theme.fontFamily} onValueChange={(v) => update('fontFamily', v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {FONT_OPTIONS.map(f => (
                                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Border Radius */}
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Border Radius</Label>
                    <div className="flex gap-2">
                        {['4px', '8px', '12px', '16px', '24px'].map(r => (
                            <button key={r} onClick={() => update('borderRadius', r)}
                                className={`w-10 h-10 border-2 transition-all ${theme.borderRadius === r ? 'border-primary' : 'border-border/50'}`}
                                style={{ borderRadius: r, backgroundColor: theme.primaryColor + '20' }} />
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily, borderRadius: theme.borderRadius }}>
                    <p className="font-bold mb-1">Preview</p>
                    <p className="text-sm opacity-70 mb-3">This is how your survey will look.</p>
                    <div className="py-2 px-4 rounded-lg text-sm font-bold text-center" style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor, borderRadius: theme.borderRadius }}>
                        Continue →
                    </div>
                </div>

                <Button variant="ghost" size="sm" className="text-xs" onClick={() => onChange(PRESET_THEMES.midnight)}>
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset to Default
                </Button>
            </CardContent>
        </Card>
    );
}
