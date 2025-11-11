"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
  LineChart, Line, ComposedChart
} from "recharts";
import { 
  Activity, Heart, Brain, TrendingUp, Zap, Sparkles, 
  BarChart3, Clock, AlertCircle, CheckCircle2, Info
} from "lucide-react";
import { analyzeStress as apiAnalyzeStress, DUMMY_THINGSPEAK_URL } from "@/lib/api";

interface MinuteResult {
  minute: number;
  stress_level: string;
  numeric_label: number;
  oxygen_level: number;
  ibi_lf_hf_ratio: number;
  scl_lf_power: number;
}

interface AnalysisResponse {
  results: MinuteResult[];
  stress_score: string;
  total_minutes: number;
  stressed_minutes: number;
  oxygen_levels: number[];
}

const STRESS_COLORS = {
  0: "#10b981", // No Stress - Emerald
  1: "#f59e0b", // Mild Stress - Amber
  2: "#ef4444", // High Stress - Red
};

const STRESS_GRADIENTS = {
  0: ["#10b981", "#34d399"],
  1: ["#f59e0b", "#fbbf24"],
  2: ["#ef4444", "#f87171"],
};

const STRESS_LABELS = {
  0: "No Stress",
  1: "Mild Stress",
  2: "High Stress",
};

export default function Dashboard() {
  const [minutes, setMinutes] = useState<number>(10);
  const [thingspeakUrl, setThingSpeakUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);

  const analyzeStress = async () => {
    if (!thingspeakUrl.trim()) {
      alert("Please enter a ThingSpeak URL");
      return;
    }

    setLoading(true);
    setAnalysisData(null); // Clear previous results
    
    try {
      const data = await apiAnalyzeStress(minutes, thingspeakUrl);
      setAnalysisData(data);
    } catch (error) {
      console.error("Error analyzing stress:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to analyze stress. Please check your ThingSpeak URL and backend connection."}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDummyAnalysis = (mins: number): AnalysisResponse => {
    const results: MinuteResult[] = [];
    let stressedCount = 0;

    // More realistic distribution
    for (let i = 1; i <= mins; i++) {
      const rand = Math.random();
      let stressLevel: string;
      let numericLabel: number;
      let oxygen: number;
      let ibiRatio: number;
      let sclPower: number;

      if (rand < 0.25) {
        // High stress - 25% chance
        stressLevel = "High Stress";
        numericLabel = 2;
        oxygen = parseFloat((94 + Math.random() * 2).toFixed(2));
        ibiRatio = parseFloat((2.5 + Math.random() * 1.5).toFixed(4));
        sclPower = parseFloat((0.4 + Math.random() * 0.3).toFixed(4));
        stressedCount++;
      } else if (rand < 0.55) {
        // Mild stress - 30% chance
        stressLevel = "Mild Stress";
        numericLabel = 1;
        oxygen = parseFloat((96 + Math.random() * 2).toFixed(2));
        ibiRatio = parseFloat((1.5 + Math.random() * 1.0).toFixed(4));
        sclPower = parseFloat((0.25 + Math.random() * 0.2).toFixed(4));
        stressedCount++;
      } else {
        // No stress - 45% chance
        stressLevel = "No Stress";
        numericLabel = 0;
        oxygen = parseFloat((98 + Math.random() * 1.5).toFixed(2));
        ibiRatio = parseFloat((0.8 + Math.random() * 0.7).toFixed(4));
        sclPower = parseFloat((0.1 + Math.random() * 0.15).toFixed(4));
      }

      results.push({
        minute: i,
        stress_level: stressLevel,
        numeric_label: numericLabel,
        oxygen_level: oxygen,
        ibi_lf_hf_ratio: ibiRatio,
        scl_lf_power: sclPower,
      });
    }

    return {
      results,
      stress_score: `${stressedCount}/${mins}`,
      total_minutes: mins,
      stressed_minutes: stressedCount,
      oxygen_levels: results.map((r) => r.oxygen_level),
    };
  };

  const getStressDistribution = () => {
    if (!analysisData) return [];
    const distribution = { 0: 0, 1: 0, 2: 0 };
    analysisData.results.forEach((r) => {
      distribution[r.numeric_label as keyof typeof distribution]++;
    });
    return [
      { name: "No Stress", value: distribution[0], color: STRESS_COLORS[0], fill: STRESS_COLORS[0] },
      { name: "Mild Stress", value: distribution[1], color: STRESS_COLORS[1], fill: STRESS_COLORS[1] },
      { name: "High Stress", value: distribution[2], color: STRESS_COLORS[2], fill: STRESS_COLORS[2] },
    ].filter((item) => item.value > 0);
  };

  const getMinuteByMinuteData = () => {
    if (!analysisData) return [];
    return analysisData.results.map((r) => ({
      minute: r.minute,
      minuteLabel: `M${r.minute}`,
      stress: r.numeric_label,
      oxygen: r.oxygen_level,
      color: STRESS_COLORS[r.numeric_label as keyof typeof STRESS_COLORS],
      stressLabel: STRESS_LABELS[r.numeric_label as keyof typeof STRESS_LABELS],
    }));
  };

  const getOxygenTrendData = () => {
    if (!analysisData) return [];
    return analysisData.results.map((r) => ({
      minute: r.minute,
      minuteLabel: `M${r.minute}`,
      oxygen: r.oxygen_level,
      stress: r.numeric_label,
    }));
  };

  const getAverageOxygen = () => {
    if (!analysisData || analysisData.oxygen_levels.length === 0) return "0.00";
    const sum = analysisData.oxygen_levels.reduce((a, b) => a + b, 0);
    return (sum / analysisData.oxygen_levels.length).toFixed(2);
  };

  const getStressPercentage = () => {
    if (!analysisData) return 0;
    return Math.round((analysisData.stressed_minutes / analysisData.total_minutes) * 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Linear-style background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 -z-10" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] -z-10" />
      
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header - Linear style */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-5xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Stress Analysis
            </h1>
          </div>
          <p className="text-gray-400 text-lg ml-14">
            Real-time stress monitoring using CEEMDAN decomposition and physiological signals
          </p>
        </div>

        {/* Configuration Card - Linear style */}
        <Card className="linear-card linear-card-hover mb-8 animate-fade-in border-gray-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-medium text-white mb-1">Analysis Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your ThingSpeak URL and analysis duration
                </CardDescription>
              </div>
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="thingspeak" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  ThingSpeak URL
                </Label>
                <Input
                  id="thingspeak"
                  type="url"
                  value={thingspeakUrl}
                  onChange={(e) => setThingSpeakUrl(e.target.value)}
                  placeholder="https://api.thingspeak.com/channels/..."
                  className="bg-black/40 border-gray-700 text-white h-12 focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For testing, use:{" "}
                  <button
                    type="button"
                    onClick={() => setThingSpeakUrl(DUMMY_THINGSPEAK_URL)}
                    className="text-[#5e6ad2] hover:text-[#525dc7] underline cursor-pointer font-mono text-xs"
                  >
                    {DUMMY_THINGSPEAK_URL}
                  </button>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Analysis Duration (minutes)
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 10)}
                  min={1}
                  max={60}
                  className="bg-black/40 border-gray-700 text-white h-12 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stress will be calculated for each 1-minute segment
                </p>
              </div>
            </div>
            <Button
              onClick={analyzeStress}
              disabled={loading || !thingspeakUrl.trim()}
              className="w-full h-11 bg-[#5e6ad2] hover:bg-[#525dc7] text-white font-medium rounded-md transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#5e6ad2] hover:shadow-[0_2px_8px_rgba(94,106,210,0.3)] active:scale-[0.98] border-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Start Analysis
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysisData && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards - Linear style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="linear-card linear-card-hover border-gray-800/50 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Stress Score</p>
                      <p className="text-3xl font-semibold text-white">
                        {analysisData.stress_score}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getStressPercentage()}% stressed
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 group-hover:scale-110 transition-transform">
                      <Brain className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="linear-card linear-card-hover border-gray-800/50 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Stressed</p>
                      <p className="text-3xl font-semibold text-white">
                        {analysisData.stressed_minutes}
                      </p>
                      <p className="text-sm text-gray-500">minutes</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="linear-card linear-card-hover border-gray-800/50 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                      <p className="text-3xl font-semibold text-white">
                        {analysisData.total_minutes}
                      </p>
                      <p className="text-sm text-gray-500">minutes</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="linear-card linear-card-hover border-gray-800/50 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Oxygen</p>
                      <p className="text-3xl font-semibold text-white">
                        {getAverageOxygen()}%
                      </p>
                      <p className="text-sm text-gray-500">average</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts - Linear style */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="linear-card border border-gray-800/50 bg-black/40 p-1 h-12">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 px-6 rounded-lg transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 px-6 rounded-lg transition-all"
                >
                  Trends
                </TabsTrigger>
                <TabsTrigger 
                  value="detailed" 
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 px-6 rounded-lg transition-all"
                >
                  Detailed
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Stress Distribution Pie Chart */}
                  <Card className="linear-card linear-card-hover border-gray-800/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-white">Stress Distribution</CardTitle>
                      <CardDescription className="text-gray-400">
                        Overall stress level breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <defs>
                            {getStressDistribution().map((entry, index) => (
                              <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={getStressDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={110}
                            innerRadius={40}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth={2}
                          >
                            {getStressDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(10, 10, 10, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "8px",
                              color: "#fff",
                              padding: "12px",
                            }}
                            itemStyle={{ color: "#fff" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Minute-by-Minute Bar Chart */}
                  <Card className="linear-card linear-card-hover border-gray-800/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-white">Minute-by-Minute Analysis</CardTitle>
                      <CardDescription className="text-gray-400">
                        Stress levels for each analyzed minute
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={getMinuteByMinuteData()} barCategoryGap="10%">
                          <defs>
                            <linearGradient id="stressGradient0" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                            </linearGradient>
                            <linearGradient id="stressGradient1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                            </linearGradient>
                            <linearGradient id="stressGradient2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="minuteLabel"
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                            domain={[0, 2]}
                            ticks={[0, 1, 2]}
                            tickFormatter={(value) => STRESS_LABELS[value as keyof typeof STRESS_LABELS]}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(10, 10, 10, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "8px",
                              color: "#fff",
                              padding: "12px",
                            }}
                            itemStyle={{ color: "#fff" }}
                            formatter={(value: number) => STRESS_LABELS[value as keyof typeof STRESS_LABELS]}
                            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                          />
                          <Bar 
                            dataKey="stress" 
                            radius={[8, 8, 0, 0]}
                            strokeWidth={0}
                          >
                            {getMinuteByMinuteData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#stressGradient${entry.stress})`}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="mt-6 space-y-6">
                {/* Oxygen Levels Trend */}
                <Card className="linear-card linear-card-hover border-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Oxygen Levels Trend</CardTitle>
                    <CardDescription className="text-gray-400">
                      Oxygen saturation levels over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={getOxygenTrendData()}>
                        <defs>
                          <linearGradient id="oxygenGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="minuteLabel"
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          domain={[90, 100]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(10, 10, 10, 0.95)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                            padding: "12px",
                          }}
                          formatter={(value: number) => [`${value}%`, "Oxygen"]}
                          labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="oxygen"
                          stroke="#10b981"
                          strokeWidth={3}
                          fill="url(#oxygenGradient)"
                          dot={{ fill: "#10b981", r: 4 }}
                          activeDot={{ r: 6, fill: "#10b981" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Combined Stress & Oxygen */}
                <Card className="linear-card linear-card-hover border-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Stress & Oxygen Correlation</CardTitle>
                    <CardDescription className="text-gray-400">
                      Combined view of stress levels and oxygen saturation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={getOxygenTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="minuteLabel"
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          domain={[90, 100]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          domain={[0, 2]}
                          ticks={[0, 1, 2]}
                          tickFormatter={(value) => STRESS_LABELS[value as keyof typeof STRESS_LABELS]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(10, 10, 10, 0.95)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                            padding: "12px",
                          }}
                          labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="oxygen"
                          fill="url(#oxygenGradient)"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={0.3}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="stress"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ fill: "#ef4444", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="detailed" className="mt-6">
                <Card className="linear-card border-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Detailed Analysis</CardTitle>
                    <CardDescription className="text-gray-400">
                      Complete breakdown of each minute with all metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="pb-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Minute</th>
                            <th className="pb-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stress Level</th>
                            <th className="pb-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Oxygen %</th>
                            <th className="pb-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IBI LF/HF</th>
                            <th className="pb-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SCL LF Power</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisData.results.map((result, index) => (
                            <tr
                              key={result.minute}
                              className="border-b border-gray-800/50 hover:bg-white/5 transition-colors group"
                            >
                              <td className="py-4 text-white font-medium">{result.minute}</td>
                              <td className="py-4">
                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                                    result.numeric_label === 2
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : result.numeric_label === 1
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  }`}
                                >
                                  {result.numeric_label === 2 ? (
                                    <AlertCircle className="w-3 h-3" />
                                  ) : result.numeric_label === 1 ? (
                                    <Info className="w-3 h-3" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  {result.stress_level}
                                </span>
                              </td>
                              <td className="py-4 text-white">{result.oxygen_level}%</td>
                              <td className="py-4 text-gray-400 font-mono text-sm">{result.ibi_lf_hf_ratio.toFixed(4)}</td>
                              <td className="py-4 text-gray-400 font-mono text-sm">{result.scl_lf_power.toFixed(4)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!analysisData && !loading && (
          <Card className="linear-card border-gray-800/50 animate-fade-in">
            <CardContent className="pt-16 pb-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-300 text-lg font-medium">
                    Ready to analyze
                  </p>
                  <p className="text-gray-500 text-sm max-w-md">
                    Enter your ThingSpeak URL and click "Start Analysis" to begin stress monitoring. 
                    The system will calculate stress levels for each 1-minute segment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
