"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SurveySettingsProps {
    settings: SurveySettingsData;
    onSettingsChange: (settings: SurveySettingsData) => void;
}

export interface SurveySettingsData {
    visibility: "public" | "private" | "community";
    allowAnonymous: boolean;
    requiresLogin: boolean;
    passwordProtected: boolean;
    password?: string;
    multipleResponses: boolean;
    responseLimit?: number;
    closingDate?: Date;
    showProgressBar: boolean;
    showQuestionNumbers: boolean;
    shuffleQuestions: boolean;
    redirectUrl?: string;
    thankYouMessage: string;
}

export function SurveySettings({ settings, onSettingsChange }: SurveySettingsProps) {
    const updateSetting = (key: keyof SurveySettingsData, value: SurveySettingsData[keyof SurveySettingsData]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Access Control */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Access & Visibility</h3>

                <div className="grid gap-2">
                    <Label>Visibility</Label>
                    <Select
                        value={settings.visibility}
                        onValueChange={(val) => updateSetting("visibility", val)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="public">Public (Anyone with link)</SelectItem>
                            <SelectItem value="community">Community (StatWoX users)</SelectItem>
                            <SelectItem value="private">Private (Invite only)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label htmlFor="anonymous">Allow Anonymous Responses</Label>
                        <span className="text-xs text-muted-foreground">Users don't need to identify themselves</span>
                    </div>
                    <Switch
                        id="anonymous"
                        checked={settings.allowAnonymous}
                        onCheckedChange={(c) => updateSetting("allowAnonymous", c)}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label htmlFor="password-protect">Password Protection</Label>
                        <span className="text-xs text-muted-foreground">Require a password to access the survey</span>
                    </div>
                    <Switch
                        id="password-protect"
                        checked={settings.passwordProtected}
                        onCheckedChange={(c) => updateSetting("passwordProtected", c)}
                    />
                </div>

                {settings.passwordProtected && (
                    <div className="ml-6">
                        <Label htmlFor="password">Survey Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={settings.password || ""}
                            onChange={(e) => updateSetting("password", e.target.value)}
                            placeholder="Set a password"
                            className="max-w-xs mt-1.5"
                        />
                    </div>
                )}
            </div>

            {/* Limits & Constraints */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Limits & Constraints</h3>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label htmlFor="multi-response">Allow Multiple Responses</Label>
                        <span className="text-xs text-muted-foreground">Users can submit more than once</span>
                    </div>
                    <Switch
                        id="multi-response"
                        checked={settings.multipleResponses}
                        onCheckedChange={(c) => updateSetting("multipleResponses", c)}
                    />
                </div>

                <div className="grid gap-2 max-w-xs">
                    <Label htmlFor="limit">Response Limit (Optional)</Label>
                    <Input
                        id="limit"
                        type="number"
                        value={settings.responseLimit || ""}
                        onChange={(e) => updateSetting("responseLimit", parseInt(e.target.value) || undefined)}
                        placeholder="e.g. 100"
                    />
                    <p className="text-xs text-muted-foreground">Automatically close after this many responses</p>
                </div>

                <div className="grid gap-2 flex-col">
                    <Label>Closing Date (Optional)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] pl-3 text-left font-normal",
                                    !settings.closingDate && "text-muted-foreground"
                                )}
                            >
                                {settings.closingDate ? (
                                    format(settings.closingDate, "PHP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={settings.closingDate}
                                onSelect={(date) => updateSetting("closingDate", date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Display Options */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Display Options</h3>

                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="progress">Show Progress Bar</Label>
                    <Switch
                        id="progress"
                        checked={settings.showProgressBar}
                        onCheckedChange={(c) => updateSetting("showProgressBar", c)}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="q-numbers">Show Question Numbers</Label>
                    <Switch
                        id="q-numbers"
                        checked={settings.showQuestionNumbers}
                        onCheckedChange={(c) => updateSetting("showQuestionNumbers", c)}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="shuffle">Shuffle Questions</Label>
                    <Switch
                        id="shuffle"
                        checked={settings.shuffleQuestions}
                        onCheckedChange={(c) => updateSetting("shuffleQuestions", c)}
                    />
                </div>
            </div>

            {/* Post Submission */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Post-Submission</h3>

                <div className="grid gap-2">
                    <Label htmlFor="thank-you">Thank You Message</Label>
                    <Input
                        id="thank-you"
                        value={settings.thankYouMessage}
                        onChange={(e) => updateSetting("thankYouMessage", e.target.value)}
                        placeholder="Thank you for your feedback!"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="redirect">Redirect URL (Optional)</Label>
                    <Input
                        id="redirect"
                        value={settings.redirectUrl || ""}
                        onChange={(e) => updateSetting("redirectUrl", e.target.value)}
                        placeholder="https://google.com"
                    />
                </div>
            </div>
        </div>
    );
}
